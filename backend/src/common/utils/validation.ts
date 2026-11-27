import { TransformFnParams } from 'class-transformer';
import { registerDecorator } from 'class-validator';

// src/core/utils/validation.ts
export const ValidationMessages = {
  IS_NOT_EMPTY: (field: string) => `${field} é obrigatório`,
  IS_NOT_BLANK: (field: string) => `${field} não pode ser vazio`,
  IS_STRING: (field: string) => `${field} deve ser um texto`,
  IS_EMAIL: (field = 'Email') => `${field} deve ser válido`,
  IS_NUMBER: (field: string) => `${field} deve ser um número`,
  IS_INT: (field: string) => `${field} deve ser um número inteiro`,
  MIN: (field: string, min: number) => `${field} deve ser no mínimo ${min}`,
  MAX: (field: string, max: number) => `${field} deve ser no máximo ${max}`,
  MIN_LENGTH: (field: string, min: number) =>
    `${field} deve ter no mínimo ${min} caracteres`,
  MAX_LENGTH: (field: string, max: number) =>
    `${field} deve ter no máximo ${max} caracteres`,
  IS_ENUM: (field: string) => `${field} inválido`,
  IS_BOOLEAN: (field: string) => `${field} deve ser verdadeiro ou falso`,
  EXACT_DIGITS: (field: string, digits: number) =>
    `${field} deve ter ${digits} dígitos`,
  DATE_ONLY: (field: string) => `${field} deve estar no formato AAAA-MM-DD`,
  IS_ARRAY: (field: string) => `${field} deve ser uma lista`,
  ARRAY_NOT_EMPTY: (field: string) => `${field} deve ter ao menos um item`,
  TIME_ONLY: (field: string) => `${field} deve estar no formato HH:mm`,
  EXACT_LENGTH: (field: string, length: number) =>
    `${field} deve ter ${length} caracteres`,
  IS_DATE: (field: string) => `${field} deve ser uma data válida`,
  IS_OBJECT: (field: string) => `${field} deve ser um objeto`,
  ARRAY_MAX_SIZE: (field: string, max: number) =>
    `${field} deve ter no máximo ${max} itens`,
  ARRAY_UNIQUE: (field: string) => `${field} não pode ter itens repetidos`,
  IS_DECIMAL: (field: string, places: number) =>
    `${field} deve ser um número com até ${places} casas decimais`,
};

const TIME_ONLY_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export function IsTimeOnly(field: string) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isTimeOnly',
      target: object.constructor,
      propertyName,
      options: { message: ValidationMessages.TIME_ONLY(field) },
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && TIME_ONLY_REGEX.test(value),
      },
    });
}

// Query string: 'true'/'false' viram boolean. Qualquer outro valor segue como
// veio e é rejeitado pelo @IsBoolean (antes virava false em silêncio).
export const toBoolean = ({ value }: TransformFnParams): unknown => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
};

export const notUndefined = (_: unknown, value: unknown) => value !== undefined;

export const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// String vazia vira null, para limpar um campo opcional
export const trimOrNull = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

export const digitsOrNull = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const onlyDigits = value.replace(/\D/g, '');
  return onlyDigits === '' ? null : onlyDigits;
};

export const upperOrNull = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const upper = value.trim().toUpperCase();
  return upper === '' ? null : upper;
};

export const digits = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/\D/g, '') : value;

export function IsDateOnly(field: string) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isDateOnly',
      target: object.constructor,
      propertyName,
      options: { message: ValidationMessages.DATE_ONLY(field) },
      validator: {
        validate: (value: unknown) => {
          if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return false;
          }
          const date = new Date(`${value}T00:00:00.000Z`);
          return (
            !Number.isNaN(date.getTime()) &&
            date.toISOString().startsWith(value)
          );
        },
      },
    });
}
