import { describe, it, expect } from 'vitest';
import { normalizeTime, toCronExpression, describeSchedule } from '../src/utils/backupSchedule.js';

describe('normalizeTime', () => {
  it('füllt einstellige Stunden auf', () => {
    expect(normalizeTime('3:05')).toBe('03:05');
  });
  it('lässt gültige Zeiten unverändert', () => {
    expect(normalizeTime('22:15')).toBe('22:15');
    expect(normalizeTime('00:00')).toBe('00:00');
    expect(normalizeTime('23:59')).toBe('23:59');
  });
  it('fällt bei Unsinn auf den Standard zurück', () => {
    // Wichtig: ein kaputter Wert darf nie zu einem ungültigen Cron-Ausdruck
    // führen, sonst liefe die Sicherung stillschweigend gar nicht mehr.
    for (const bad of ['', null, undefined, 'abc', '25:00', '12:60', '12', '-1:30']) {
      expect(normalizeTime(bad)).toBe('03:30');
    }
  });
});

describe('toCronExpression', () => {
  it('täglich', () => {
    expect(toCronExpression({ frequency: 'daily', time: '03:30', weekday: 0 })).toBe('30 3 * * *');
    expect(toCronExpression({ frequency: 'daily', time: '22:15', weekday: 3 })).toBe('15 22 * * *');
  });
  it('wöchentlich berücksichtigt den Wochentag', () => {
    expect(toCronExpression({ frequency: 'weekly', time: '22:15', weekday: 3 })).toBe('15 22 * * 3');
    expect(toCronExpression({ frequency: 'weekly', time: '00:00', weekday: 0 })).toBe('0 0 * * 0');
  });
  it('ungültige Zeit ergibt trotzdem einen gültigen Ausdruck', () => {
    expect(toCronExpression({ frequency: 'daily', time: 'kaputt', weekday: 0 })).toBe('30 3 * * *');
  });
});

describe('describeSchedule', () => {
  it('beschreibt täglich und wöchentlich lesbar', () => {
    expect(describeSchedule({ frequency: 'daily', time: '03:30', weekday: 0 })).toBe('täglich 03:30 Uhr');
    expect(describeSchedule({ frequency: 'weekly', time: '22:15', weekday: 3 })).toBe(
      'wöchentlich Mittwoch, 22:15 Uhr',
    );
  });
});
