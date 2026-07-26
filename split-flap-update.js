import {
  CHARSETS,
  charToken,
  iconToken,
  normaliseToken,
  sleep,
  textTokens,
  tokenSignature,
  tokensEqual,
} from './split-flap-utils.js?v=0.1.0';

export const updateMethods = {
  _updateBoard(initial = false) {
    if (!this._hass || !this._rendered) return;

    const targetRows = this._config.rows.map((row) => this._rowTokens(row));
    const signature = tokenSignature(targetRows);
    if (!initial && signature === this._targetSignature) return;

    this._targetSignature = signature;
    this._animationGeneration += 1;
    const generation = this._animationGeneration;

    const changes = [];
    targetRows.forEach((row, rowIndex) => {
      row.forEach((target, columnIndex) => {
        const state = this._cellStates[rowIndex][columnIndex];
        state.pending = normaliseToken(target);
        if (!tokensEqual(state.current, state.pending)) {
          changes.push({ rowIndex, columnIndex });
        }
      });
    });

    if (initial) {
      changes.forEach(({ rowIndex, columnIndex }) => {
        const state = this._cellStates[rowIndex][columnIndex];
        const refs = this._cells[rowIndex][columnIndex];
        state.current = normaliseToken(state.pending);
        state.pending = null;
        this._renderToken(refs.topStatic, state.current);
        this._renderToken(refs.bottomStatic, state.current);
      });
      return;
    }

    this._runChangeQueue(changes, generation);
  },

  async _runChangeQueue(changes, generation) {
    let cursor = 0;
    const workers = Array.from(
      { length: Math.min(this._config.max_parallel_cells, changes.length) },
      async (_, workerIndex) => {
        while (cursor < changes.length && generation === this._animationGeneration) {
          const itemIndex = cursor;
          const item = changes[cursor++];
          if (itemIndex > 0 || workerIndex > 0) {
            await sleep(this._config.cell_stagger);
          }
          await this._animateCellTo(item.rowIndex, item.columnIndex, generation);
        }
      }
    );
    await Promise.all(workers);
  },

  async _animateCellTo(rowIndex, columnIndex, generation) {
    const state = this._cellStates[rowIndex]?.[columnIndex];
    const refs = this._cells[rowIndex]?.[columnIndex];
    if (!state || !refs || state.busy) return;

    state.busy = true;
    try {
      while (state.pending && generation === this._animationGeneration) {
        const desired = normaliseToken(state.pending);
        state.pending = null;
        if (tokensEqual(state.current, desired)) continue;

        if (state.current.type === 'char' && desired.type === 'char') {
          const sequence = this._characterSequence(state.current.value, desired.value);
          for (const nextCharacter of sequence) {
            if (generation !== this._animationGeneration) return;
            const nextToken = charToken(nextCharacter);
            await this._flipCell(refs, state.current, nextToken, this._config.step_duration);
            state.current = nextToken;
            if (state.pending) break;
          }
        } else {
          await this._flipCell(refs, state.current, desired, this._config.flip_duration);
          state.current = desired;
        }
      }
    } finally {
      state.busy = false;
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

      this._renderToken(refs.topStatic, fromToken);
      this._renderToken(refs.bottomStatic, fromToken);
      this._renderToken(refs.upperFlap, fromToken);
      this._renderToken(refs.lowerFlap, toToken);

      refs.root.classList.remove('is-flipping');
      void refs.root.offsetHeight;
      refs.root.classList.add('is-flipping');

      const midpointTimer = window.setTimeout(() => {
        this._renderToken(refs.topStatic, toToken);
      }, halfDuration);

      const finishTimer = window.setTimeout(() => {
        refs.root.classList.remove('is-flipping');
        this._renderToken(refs.topStatic, toToken);
        this._renderToken(refs.bottomStatic, toToken);
        this._animationTimers.delete(midpointTimer);
        this._animationTimers.delete(finishTimer);
        resolve();
      }, halfDuration * 2 + 18);

      this._animationTimers.add(midpointTimer);
      this._animationTimers.add(finishTimer);
    });
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
      return Array.from({ length: segment.width || 1 }, () => charToken(' '));
    }
    if (segment.type === 'icon') return [iconToken(segment.icon)];
    if (segment.type === 'entity_icon') {
      const stateObject = this._hass.states[segment.entity];
      return [iconToken(stateObject?.attributes?.icon || segment.fallback_icon)];
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
    return textTokens(value);
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

    const padding = Array.from({ length: missing }, () => charToken(segment.pad || ' '));
    const alignment = String(segment.align || 'left').toLowerCase();
    if (alignment === 'right') return [...padding, ...result];
    if (alignment === 'center') {
      const left = Math.floor(missing / 2);
      return [...padding.slice(0, left), ...result, ...padding.slice(left)];
    }
    return [...result, ...padding];
  },
};
