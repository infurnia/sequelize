import isPlainObject from 'lodash/isPlainObject';
import type { Rangable, RangePart, Range, InputRangePart } from '../../model.js';

function stringifyRangeBound<T>(bound: T | number | null, stringifyBoundary: (val: T) => string): string {
  if (bound === null) {
    return '';
  }

  if (bound === Number.POSITIVE_INFINITY || bound === Number.NEGATIVE_INFINITY) {
    return bound.toString().toLowerCase();
  }

  return stringifyBoundary(bound as T);
}

type ParseValue<T> = (input: string) => T;

function parseRangeBound<T>(bound: string, parseType: ParseValue<T>): T | number | null {
  if (!bound) {
    return null;
  }

  if (bound === 'infinity') {
    return Number.POSITIVE_INFINITY;
  }

  if (bound === '-infinity') {
    return Number.NEGATIVE_INFINITY;
  }

  return parseType(bound);
}

export function stringify<T>(range: Rangable<T>, stringifyBoundary: (val: T) => string): string {
  // if (!Array.isArray(data)) {
  //   throw new TypeError('range must be an array');
  // }

  if (range.length === 0) {
    return 'empty';
  }

  if (range.length !== 2) {
    throw new Error('range array length must be 0 (empty) or 2 (lower and upper bounds)');
  }

  const inclusivity = [true, false];
  const bounds = range.map((rangePart, index) => {
    if (isInputRangePart<T>(rangePart)) {
      if (typeof rangePart.inclusive === 'boolean') {
        inclusivity[index] = rangePart.inclusive;
      }

      rangePart = rangePart.value;
    }

    return stringifyRangeBound(rangePart, stringifyBoundary);
  });

  return `${(inclusivity[0] ? '[' : '(') + bounds[0]},${bounds[1]}${inclusivity[1] ? ']' : ')'}`;
}

export function parse<T>(value: string, parser: ParseValue<T>): Range<T> {
  if (typeof value !== 'string') {
    throw new TypeError(`Sequelize could not parse range "${value}" as its format is incompatible`);
  }

  if (value === 'empty') {
    return [];
  }

  const result = value
    .slice(1, -1)
    .split(',', 2);

  if (result.length !== 2) {
    throw new TypeError(`Sequelize could not parse range "${value}" as its format is incompatible`);
  }

  return result.map((item, index) => {
    const part: RangePart<T | number | null> = {
      value: parseRangeBound(item, parser),
      inclusive: index === 0 ? value.startsWith('[') : value.endsWith(']'),
    };

    return part;
  }) as Range<T>;
}

export function isInputRangePart<T>(val: unknown): val is InputRangePart<T> {
  return isPlainObject(val) && Object.prototype.hasOwnProperty.call(val, 'value');
}