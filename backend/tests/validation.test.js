import { describe, it, expect } from 'vitest';
import { deriveStatus, toDate, toMoney } from '../src/utils/validation.js';

describe('deriveStatus', () => {
  it('leer -> not_started', () => {
    expect(deriveStatus([]).status).toBe('not_started');
  });
  it('alle erledigt -> done', () => {
    const r = deriveStatus([{ isDone: true }, { isDone: true }]);
    expect(r.status).toBe('done');
    expect(r.progress).toBe(1);
  });
  it('teilweise -> in_progress', () => {
    const r = deriveStatus([{ isDone: true }, { isDone: false }]);
    expect(r.status).toBe('in_progress');
    expect(r.done).toBe(1);
    expect(r.total).toBe(2);
  });
});

describe('toDate', () => {
  it('YYYY-MM-DD -> UTC-Mitternacht', () => {
    expect(toDate('2026-03-01').toISOString()).toBe('2026-03-01T00:00:00.000Z');
  });
  it('leer -> null', () => expect(toDate('')).toBeNull());
  it('ungültig -> null', () => expect(toDate('quatsch')).toBeNull());
});

describe('toMoney', () => {
  it('parst Zahl', () => expect(toMoney('42.5')).toBe(42.5));
  it('leer -> null', () => expect(toMoney('')).toBeNull());
  it('nicht-Zahl -> null', () => expect(toMoney('abc')).toBeNull());
});
