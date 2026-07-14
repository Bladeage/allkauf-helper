import { describe, it, expect } from 'vitest';
import { computeEffectiveDueDate } from '../src/utils/dueDate.js';

const day = (d) => d.toISOString().slice(0, 10);

describe('computeEffectiveDueDate', () => {
  it('ohne Datum/Links -> null', () => {
    expect(computeEffectiveDueDate({})).toBeNull();
  });
  it('nur dueDate', () => {
    expect(day(computeEffectiveDueDate({ dueDate: '2026-05-10' }))).toBe('2026-05-10');
  });
  it('Meilenstein minus daysBefore', () => {
    const t = { milestoneLinks: [{ daysBefore: 14, milestone: { actualDate: '2026-06-01' } }] };
    expect(day(computeEffectiveDueDate(t))).toBe('2026-05-18');
  });
  it('frühestes Datum gewinnt (konservativste Erinnerung)', () => {
    const t = {
      dueDate: '2026-06-20',
      milestoneLinks: [{ daysBefore: 0, milestone: { actualDate: '2026-06-10' } }],
    };
    expect(day(computeEffectiveDueDate(t))).toBe('2026-06-10');
  });
});
