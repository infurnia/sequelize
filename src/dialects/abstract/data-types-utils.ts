import NodeUtils from 'util';
import { ValidationErrorItem } from '../../errors/index.js';
import type { Model } from '../../model.js';
import { logger } from '../../utils/logger.js';
import type { DataType, DataTypeClass, DataTypeInstance } from './data-types.js';
import { AbstractDataType } from './data-types.js';
import type { AbstractDialect } from './index.js';

const printedWarnings = new Set<string>();

export function createDataTypesWarn(link: string) {
  return (text: string) => {
    if (printedWarnings.has(text)) {
      return;
    }

    printedWarnings.add(text);
    logger.warn(`${text} \n>> Check: ${link}`);
  };
}

export function isDataType(value: any): value is DataType {
  return isDataTypeClass(value) || value instanceof AbstractDataType;
}

export function isDataTypeClass(value: any): value is DataTypeClass {
  return typeof value === 'function' && value.prototype instanceof AbstractDataType;
}

export function cloneDataType(value: DataTypeInstance | string): DataTypeInstance | string {
  if (typeof value === 'string') {
    return value;
  }

  return value.clone();
}

export function normalizeDataType(Type: DataType, dialect: AbstractDialect): AbstractDataType<unknown>;
export function normalizeDataType(Type: string, dialect: AbstractDialect): string;
export function normalizeDataType(Type: DataType | string, dialect: AbstractDialect): AbstractDataType<unknown> | string {
  if (typeof Type === 'string') {
    return Type;
  }

  if (typeof Type !== 'function' && !(Type instanceof AbstractDataType)) {
    throw new TypeError(`Expected type to be a string, a DataType class, or a DataType instance, but got ${NodeUtils.inspect(Type)}.`);
  }

  const type = typeof Type === 'function'
    ? new Type()
    : Type;

  return type.toDialectDataType(dialect);
}

export function validateDataType(
  type: AbstractDataType<any>,
  attributeName: string,
  modelInstance: Model<any> | null,
  value: unknown,
): ValidationErrorItem | null {
  try {
    type.validate(value);

    return null;
  } catch (error) {
    if (!(error instanceof ValidationErrorItem)) {
      // eslint-disable-next-line unicorn/prefer-type-error
      throw new Error(`Validation encountered an unexpected error while validating attribute ${attributeName}. (Note: If this error is intended, ${type.constructor.name}#validate must thrown an instance of ValidationErrorItem instead)`, {
        cause: error,
      });
    }

    error.path = attributeName;
    error.value = value;
    error.instance = modelInstance;
    // @ts-expect-error -- untyped constructor
    error.validatorKey = `${type.constructor.getDataTypeId()} validator`;

    return error;
  }
}
