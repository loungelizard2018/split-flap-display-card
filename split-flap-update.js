import {
  CHARSETS,
  charToken,
  iconToken,
  normaliseToken,
  sleep,
  textTokens,
  tokenSignature,
  tokensEqual,
} from './split-flap-utils.js?v=0.2.29';

export const updateMethods = {
  _updateBoard(initial = false) {
    if (!this._hass || !this._rendered) return;

    this._updateHeading();
    const targetRows = this._config.display_mode === 'departure_board'
      ? this._departureRows()
      : this._config.rows.map((row) => this._rowTokens(row));

    const signature = tokenSignature(targetRows);

    if (initial) {
      this._applyRowsImmediately(targetRows, signature);
      return;
    }

    if (
      signature === this._targetSignature &&
      !this._liveUpdateRunning &&
      !this._queuedLiveUpdate
    ) {
      return;
    }

    this._queuedLiveUpdate = {
      rows: targetRows.map((row) => row.map(normaliseToken)),
      signature,
    };
    this._drainLiveUpdates();
  },

  _applyRowsImmediately(targetRows, signature = tokenSignature(targetRows)) {
    this._cancelAnimations();
    this._liveUpdateRunning = false;
    this._queuedLiveUpdate = null;

    targetRows.forEach((row, rowIndex) => {
      row.forEach((target, columnIndex) => {
        const state = this._cellStates[rowIndex]?.[columnIndex];
        const refs = this._cells[rowIndex]?.[columnIndex];
        if (!state || !refs) return;

        const desired = normaliseToken(target);
        state.current = desired;
        state.pending = null;
        state.busy = false;
        this._renderToken(refs.topStatic, desired);
        this._renderToken(refs.bottomStatic, desired);
      });
    });

    this._targetSignature = signature;
  },

  async _drainLiveUpdates() {
    if (this._liveUpdateRunning) return;
    this._liveUpdateRunning = true;

    try {
      while (
        this._queuedLiveUpdate &&
        this._rendered &&
        this.isConnected
      ) {
        const snapshot = this._queuedLiveUpdate;
        this._queuedLiveUpdate = null;

        if (snapshot.signature === this._targetSignature) continue;

        const completed = await this._runLiveTransition(
          snapshot.rows,
          snapshot.signature,
          this._config.live_update_style
        );

        if (!completed) {
          if (
            this._rendered &&
            this.isConnected &&
            !this._initialAnimationPending
          ) {
            this._queuedLiveUpdate = snapshot;
          }
          break;
        }
      }
    } finally {
      this._liveUpdateRunning = false;

      if (
        this._queuedLiveUpdate &&
        this._rendered &&
        this.isConnected &&
        !this._initialAnimationPending
      ) {
        this._drainLiveUpdates();
      }
    }
  },

  async _runLiveTransition(targetRows, signature, style = this._config.live_update_style) {
    if (!this._rendered || !this.isConnected) return false;

    const generation = this._animationGeneration;
    const changes = [];

    targetRows.forEach((row, rowIndex) => {
      row.forEach((target, columnIndex) => {
        const state = this._cellStates[rowIndex]?.[columnIndex];
        if (!state) return;

        const desired = normaliseToken(target);
        if (!tokensEqual(state.current, desired)) {
          changes.push({ rowIndex, columnIndex, desired });
        }
      });
    });

    if (changes.length === 0) {
      this._targetSignature = signature;
      return true;
    }

    const completed = style === 'wheel'
      ? await this._runWheelChangeQueue(changes, generation)
      : await this._runDirectRowQueue(changes, generation);

    if (
      completed &&
      generation === this._animationGeneration &&
      this._rendered &&
      this.isConnected
    ) {
      this._targetSignature = signature;
      return true;
    }

    return false;
  },

  async _runDirectRowQueue(changes, generation) {
    const rowChanges = new Map();

    changes.forEach((item) => {
      if (!rowChanges.has(item.rowIndex)) rowChanges.set(item.rowIndex, []);
      rowChanges.get(item.rowIndex).push(item);
    });

    const groups = [...rowChanges.entries()]
      .sort(([leftRow], [rightRow]) => leftRow - rightRow)
      .map(([, items]) => items);

    if (this._config.start_mode === 'simultaneous') {
      const results = await Promise.all(
        groups.map(async (items, index) => {
          if (index > 0 && this._config.live_row_stagger > 0) {
            await sleep(index * this._config.live_row_stagger);
          }
          if (generation !== this._animationGeneration) return false;
          return this._animateDirectRow(items, generation);
        })
      );
      return results.every(Boolean);
    }

    for (let index = 0; index < groups.length; index += 1) {
      if (generation !== this._animationGeneration) return false;

      const completed = await this._animateDirectRow(groups[index], generation);
      if (!completed) return false;

      if (index < groups.length - 1 && this._config.live_row_stagger > 0) {
        await sleep(this._config.live_row_stagger);
      }
    }

    return true;
  },

  async _animateDirectRow(items, generation) {
    const results = await Promise.all(
      items.map((item) =>
        this._animateCellDirectTo(
          item.rowIndex,
          item.columnIndex,
          item.desired,
          generation,
          this._config.flip_duration
        )
      )
    );
    return results.every(Boolean);
  },

  async _animateCellDirectTo(rowIndex, columnIndex, desiredValue, generation, duration) {
    const state = this._cellStates[rowIndex]?.[columnIndex];
    const refs = this._cells[rowIndex]?.[columnIndex];
    if (!state || !refs) return false;

    const desired = normaliseToken(desiredValue);
    if (tokensEqual(state.current, desired)) return true;

    const runId = (state.runId || 0) + 1;
    state.runId = runId;
    state.busy = true;
    state.pending = null;

    try {
      const from = normaliseToken(state.current);
      const committed = await this._flipCell(refs, from, desired, duration);

      if (
        !committed ||
        generation !== this._animationGeneration ||
        runId !== state.runId
      ) {
        return false;
      }

      state.current = desired;
      return true;
    } finally {
      if (state.runId === runId) state.busy = false;
    }
  },

  async _runWheelChangeQueue(changes, generation) {
    if (this._config.start_mode === 'simultaneous') {
      const results = await Promise.all(changes.map(async (item, index) => {
        if (this._config.cell_stagger > 0 && index > 0) {
          await sleep(index * this._config.cell_stagger);
        }
        if (generation !== this._animationGeneration) return false;
        return this._animateCellWheelTo(
          item.rowIndex,
          item.columnIndex,
          item.desired,
          generation
        );
      }));
      return results.every(Boolean);
    }

    let cursor = 0;
    let failed = false;
    const workers = Array.from(
      { length: Math.min(this._config.max_parallel_cells, changes.length) },
      async () => {
        while (
          cursor < changes.length &&
          generation === this._animationGeneration &&
          !failed
        ) {
          const item = changes[cursor++];
          const completed = await this._animateCellWheelTo(
            item.rowIndex,
            item.columnIndex,
            item.desired,
            generation
          );
          if (!completed) {
            failed = true;
            return;
          }
          if (this._config.cell_stagger > 0 && cursor < changes.length) {
            await sleep(this._config.cell_stagger);
          }
        }
      }
    );

    await Promise.all(workers);
    return !failed && generation === this._animationGeneration;
  },

  async _animateCellWheelTo(rowIndex, columnIndex, desiredValue, generation) {
    const state = this._cellStates[rowIndex]?.[columnIndex];
    const refs = this._cells[rowIndex]?.[columnIndex];
    if (!state || !refs) return false;

    const desired = normaliseToken(desiredValue);
    if (tokensEqual(state.current, desired)) return true;

    const runId = (state.runId || 0) + 1;
    state.runId = runId;
    state.busy = true;
    state.pending = null;

    try {
      if (state.current.type === 'char' && desired.type === 'char') {
        if (state.current.value === desired.value) {
          const committed = await this._flipCell(
            refs,
            state.current,
            desired,
            this._config.flip_duration
          );

          if (
            !committed ||
            generation !== this._animationGeneration ||
            runId !== state.runId
          ) {
            return false;
          }

          state.current = desired;
          return true;
        }

        const sequence = this._characterSequence(
          state.current.value,
          desired.value
        );

        for (const nextCharacter of sequence) {
          if (
            generation !== this._animationGeneration ||
            runId !== state.runId
          ) {
            return false;
          }

          const nextToken = charToken(nextCharacter, desired.color);
          const committed = await this._flipCell(
            refs,
            state.current,
            nextToken,
            this._config.step_duration
          );

          if (
            !committed ||
            generation !== this._animationGeneration ||
            runId !== state.runId
          ) {
            return false;
          }

          state.current = nextToken;
        }

        return true;
      }

      const committed = await this._flipCell(
        refs,
        state.current,
        desired,
        this._config.flip_duration
      );

      if (
        !committed ||
        generation !== this._animationGeneration ||
        runId !== state.runId
      ) {
        return false;
      }

      state.current = desired;
      return true;
    } finally {
      if (state.runId === runId) state.busy = false;
    }
  },

  _characterSequence(currentCharacter, targetCharacter) {
    const charset = CHARSETS[this._config.character_set] || CHARSETS.airport_de;
    const startCharacter = charset.includes(currentCharacter) ? currentCharacter : ' ';
    const endCharacter = charset.includes(targetCharacter) ? targetCharacter : ' ';
    let index = charset.indexOf(startCharacter);
    const targetIndex = charset.indexOf(endCharacter);
    const sequence = [];

    while (index !== targetIndex) {
      index = (index + 1) % charset.length;
      sequence.push(charset[index]);
      if (sequence.length > charset.length) break;
    }
    return sequence;
  },

  _flipCell(refs, fromToken, toToken, duration) {
    return new Promise((resolve) => {
      const halfDuration = Math.max(20, Math.round(duration / 2));
      refs.root.style.setProperty('--flip-half-duration', `${halfDuration}ms`);

      let settled = false;
      let midpointTimer = null;
      let finishTimer = null;

      const settle = (committed) => {
        if (settled) return;
        settled = true;

        if (midpointTimer !== null) window.clearTimeout(midpointTimer);
        if (finishTimer !== null) window.clearTimeout(finishTimer);
        if (midpointTimer !== null) this._animationTimers.delete(midpointTimer);
        if (finishTimer !== null) this._animationTimers.delete(finishTimer);

        refs.root.classList.remove('is-flipping');
        const stableToken = committed ? toToken : fromToken;
        this._renderToken(refs.topStatic, stableToken);
        this._renderToken(refs.bottomStatic, stableToken);
        this._activeFlips.delete(cancel);
        resolve(committed);
      };

      const cancel = () => settle(false);
      this._activeFlips.add(cancel);

      this._renderToken(refs.topStatic, fromToken);
      this._renderToken(refs.bottomStatic, fromToken);
      this._renderToken(refs.upperFlap, fromToken);
      this._renderToken(refs.lowerFlap, toToken);

      refs.root.classList.remove('is-flipping');
      void refs.root.offsetHeight;
      refs.root.classList.add('is-flipping');

      midpointTimer = window.setTimeout(() => {
        if (!settled) this._renderToken(refs.topStatic, toToken);
      }, halfDuration);

      finishTimer = window.setTimeout(
        () => settle(true),
        halfDuration * 2 + 18
      );

      this._animationTimers.add(midpointTimer);
      this._animationTimers.add(finishTimer);
    });
  },

  _updateHeading() {
    const stationElement = this.shadowRoot.querySelector('[data-station-name]');
    if (stationElement) {
      const stateObject = this._config.entity ? this._hass.states[this._config.entity] : null;
      const stationName = this._config.subtitle ||
        stateObject?.attributes?.[this._config.station_name_attribute] || '';
      stationElement.textContent = stationName;
      stationElement.style.display = stationName ? '' : 'none';
    }

    const clockElement = this.shadowRoot.querySelector('[data-header-clock]');
    if (clockElement) {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: this._hass.config?.time_zone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(new Date());
      const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      clockElement.textContent = `${values.hour || ''}:${values.minute || ''}`;
    }
  },

  _departureRows() {
    const stateObject = this._hass.states[this._config.entity];
    const departures = stateObject?.attributes?.[this._config.departure_attribute];
    const records = Array.isArray(departures) ? departures.slice(0, this._config.visible_rows) : [];
    const rows = records.map((record) => this._departureRecordTokens(record));

    while (rows.length < this._config.visible_rows) {
      rows.push(Array.from({ length: this._config.columns }, () => charToken(' ')));
    }
    return rows;
  },

  _departureRecordTokens(record) {
    const colors = this._config.departure_colors;
    const cancelled = Boolean(record?.cancelled || record?.is_cancelled);
    const delay = Number(record?.delay || 0);
    const normalColor = cancelled ? colors.cancelled : colors.normal;
    const delayColor = cancelled ? colors.cancelled : (delay !== 0 ? colors.delayed : colors.normal);
    const transportMode = this._transportMode(record);
    const configuredIcon = this._config.transport_icon_map[transportMode] || this._config.transport_icon_map.unknown;
    const icon = this._transportBadgeToken(record, transportMode, configuredIcon);
    const platform = String(record?.platform || '').trim();
    const delayText = cancelled
      ? 'CANCEL'
      : delay > 0
        ? `(+${delay})`
        : delay < 0
          ? `(${delay})`
          : '';

    const columns = this._config.board_columns;
    const fields = [
      this._fitSegment([iconToken(icon, normalColor)], columns.mode, { align: 'center', pad: ' ' }),
      this._departureGap(),
      this._fitSegment(textTokens(record?.departure_time || record?.planned_time || '', normalColor), columns.time, { align: 'left', pad: ' ' }),
      this._departureGap(),
      this._fitSegment(textTokens(record?.line || '', normalColor), columns.line, { align: 'center', pad: ' ' }),
      this._departureGap(),
      this._fitSegment(textTokens(record?.destination || '', normalColor), columns.destination, { align: 'left', pad: ' ' }),
      this._departureGap(),
      this._fitSegment(textTokens(platform, normalColor), columns.platform, { align: 'center', pad: ' ' }),
      this._departureGap(),
      this._fitSegment(textTokens(delayText, delayColor), columns.delay, { align: 'right', pad: ' ' }),
    ];

    const row = fields.flat().slice(0, this._config.columns);
    while (row.length < this._config.columns) row.push(charToken(' '));
    return row;
  },

  _departureGap() {
    return Array.from(
      { length: this._config.board_columns.gap },
      () => charToken(' ')
    );
  },

  _transportBadgeToken(record, transportMode, configuredIcon) {
    const line = String(record?.line || '').trim().toUpperCase();
    const icon = String(configuredIcon || '');

    if (transportMode === 'sbahn' && icon === 'mdi:alpha-s-circle') {
      return 'splitflap:sbahn';
    }

    if (transportMode === 'ice' && icon === 'splitflap:ice') {
      const label = line.startsWith('ECE') ? 'ECE' : 'ICE';
      return `splitflap:ice:${label}`;
    }

    if (transportMode === 'ic' && icon === 'splitflap:ic') {
      const label = line.startsWith('EC') ? 'EC' : 'IC';
      return `splitflap:ic:${label}`;
    }

    if (transportMode === 'regional' && icon === 'splitflap:regional') {
      const match = line.match(/^(IRE|MEX|RE|RB|R)/);
      return `splitflap:regional:${match?.[1] || 'RE'}`;
    }

    return icon;
  },

  _transportMode(record) {
    const type = String(record?.transportation_type || '').toLowerCase();
    const line = String(record?.line || '').trim().toUpperCase();

    if (/^S\s?\d+/.test(line)) return 'sbahn';
    if (/^U\s?\d+/.test(line)) return 'subway';
    if (/^(IRE|MEX|RE|RB|R)\s?\d*/.test(line)) return 'regional';
    if (/^(ICE|ECE)\s?\d*/.test(line)) return 'ice';
    if (/^(IC|EC)\s?\d*/.test(line)) return 'ic';
    if (type.includes('bus')) return 'bus';
    if (type.includes('tram') || type.includes('streetcar')) return 'tram';
    if (type.includes('subway') || type.includes('metro')) return 'subway';
    if (type.includes('ferry')) return 'ferry';
    if (type.includes('train') || type.includes('rail')) return 'train';
    return 'unknown';
  },

  _rowTokens(row) {
    const tokens = [];
    row.segments.forEach((segment) => {
      if (tokens.length >= this._config.columns) return;
      const segmentTokens = this._segmentTokens(segment);
      const width = segment.width == null ? segmentTokens.length : segment.width;
      tokens.push(...this._fitSegment(segmentTokens, width, segment));
    });

    const content = tokens.slice(0, this._config.columns);
    const missing = this._config.columns - content.length;
    if (missing <= 0) return content;

    if (String(row.align).toLowerCase() === 'right') {
      return [...Array.from({ length: missing }, () => charToken(' ')), ...content];
    }
    if (String(row.align).toLowerCase() === 'center') {
      const left = Math.floor(missing / 2);
      const right = missing - left;
      return [
        ...Array.from({ length: left }, () => charToken(' ')),
        ...content,
        ...Array.from({ length: right }, () => charToken(' ')),
      ];
    }
    return [...content, ...Array.from({ length: missing }, () => charToken(' '))];
  },

  _segmentTokens(segment) {
    if (segment.type === 'spacer') {
      return Array.from({ length: segment.width || 1 }, () => charToken(' ', segment.color));
    }
    if (segment.type === 'icon') return [iconToken(segment.icon, segment.color)];
    if (segment.type === 'entity_icon') {
      const stateObject = this._hass.states[segment.entity];
      return [iconToken(stateObject?.attributes?.icon || segment.fallback_icon, segment.color)];
    }

    let value = '';
    if (segment.type === 'text') value = segment.value ?? '';
    if (segment.type === 'entity') value = this._entityValue(segment);
    if (segment.type === 'attribute') value = this._entityValue(segment, true);
    if (segment.type === 'friendly_name') {
      value = this._hass.states[segment.entity]?.attributes?.friendly_name || '';
    }
    if (segment.type === 'datetime') value = this._dateTimeValue(segment);

    value = `${segment.prefix || ''}${value}${segment.suffix || ''}`;
    const uppercase = segment.uppercase ?? this._config.uppercase;
    if (uppercase) value = String(value).toUpperCase();
    return textTokens(value, segment.color);
  },

  _entityValue(segment, forceAttribute = false) {
    const stateObject = this._hass.states[segment.entity];
    if (!stateObject) return '';

    let value = forceAttribute || segment.attribute
      ? stateObject.attributes?.[segment.attribute]
      : stateObject.state;

    if (value === 'unavailable') return this._config.unavailable_text;
    if (value === 'unknown') return this._config.unknown_text;
    if (value == null) return '';

    const numeric = Number(String(value).replace(',', '.'));
    if (Number.isFinite(numeric) && segment.decimals != null) {
      value = numeric.toFixed(Number(segment.decimals));
      if (segment.decimal_separator === ',') value = value.replace('.', ',');
    }

    if (segment.use_entity_unit) {
      value = `${value}${segment.unit_separator ?? ' '}${stateObject.attributes?.unit_of_measurement || ''}`;
    }
    return String(value);
  },

  _dateTimeValue(segment) {
    const rawValue = segment.entity
      ? this._entityValue({ ...segment, decimals: undefined })
      : '';
    const date = rawValue ? new Date(rawValue) : new Date();
    if (Number.isNaN(date.getTime())) return rawValue;

    const timeZone = segment.time_zone || this._hass.config?.time_zone;
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return String(segment.format || 'HH:mm')
      .replaceAll('yyyy', values.year || '')
      .replaceAll('dd', values.day || '')
      .replaceAll('MM', values.month || '')
      .replaceAll('HH', values.hour || '')
      .replaceAll('mm', values.minute || '')
      .replaceAll('ss', values.second || '');
  },

  _fitSegment(tokens, widthValue, segment) {
    const width = Math.max(0, Number(widthValue) || 0);
    let result = tokens.map(normaliseToken);
    if (result.length > width) result = result.slice(0, width);

    const missing = width - result.length;
    if (missing <= 0) return result;

    const padding = Array.from(
      { length: missing },
      () => charToken(segment.pad || ' ', segment.color)
    );
    const alignment = String(segment.align || 'left').toLowerCase();
    if (alignment === 'right') return [...padding, ...result];
    if (alignment === 'center') {
      const left = Math.floor(missing / 2);
      return [...padding.slice(0, left), ...result, ...padding.slice(left)];
    }
    return [...result, ...padding];
  },
};
