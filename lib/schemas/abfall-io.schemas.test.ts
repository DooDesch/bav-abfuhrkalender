import { describe, it, expect } from 'vitest';
import {
  parseHiddenInputs,
  extractSessionToken,
  parseSelectOptions,
  parseIcsContent,
  parseHtmlAppointments,
  extractFractionsFromAppointments,
} from './abfall-io.schemas';

describe('AbfallIO Schema Parsers', () => {
  describe('parseHiddenInputs', () => {
    it('should extract hidden input fields from HTML', () => {
      const html = `
        <form>
          <input type="hidden" name="token123" value="abc456">
          <input type="hidden" name="f_id_kommune" value="1234">
          <input type="text" name="visible" value="should_ignore">
        </form>
      `;

      const result = parseHiddenInputs(html);

      expect(result).toEqual({
        token123: 'abc456',
        f_id_kommune: '1234',
      });
    });

    it('should handle different attribute orders', () => {
      const html = `
        <input name="field1" value="val1" type="hidden">
        <input type="hidden" name="field2" value="val2">
      `;

      const result = parseHiddenInputs(html);

      expect(result.field1).toBe('val1');
      expect(result.field2).toBe('val2');
    });

    it('should return empty object for HTML without hidden inputs', () => {
      const html = '<form><input type="text" name="visible"></form>';

      const result = parseHiddenInputs(html);

      expect(result).toEqual({});
    });
  });

  describe('extractSessionToken', () => {
    it('should extract UUID-like session tokens', () => {
      const hiddenInputs = {
        '72b446ed74c0f34cd6f10f279dee3bd8': 'session_value',
        f_id_kommune: '1234',
        f_id_strasse: '5678',
      };

      const result = extractSessionToken(hiddenInputs);

      expect(result.token).toEqual({
        '72b446ed74c0f34cd6f10f279dee3bd8': 'session_value',
      });
      expect(result.createdAt).toBeDefined();
      expect(typeof result.createdAt).toBe('number');
    });

    it('should exclude known field names from token', () => {
      const hiddenInputs = {
        f_id_kommune: '1234',
        f_id_strasse: '5678',
        f_id_bezirk: '9999',
      };

      const result = extractSessionToken(hiddenInputs);

      expect(result.token).toEqual({});
    });
  });

  describe('parseSelectOptions', () => {
    it('should extract options from select element', () => {
      const html = `
        <select name="kommune">
          <option value="">Bitte auswählen...</option>
          <option value="1">Lilienthal</option>
          <option value="2">Worpswede</option>
        </select>
      `;

      const result = parseSelectOptions(html);

      expect(result).toEqual([
        { value: '1', label: 'Lilienthal' },
        { value: '2', label: 'Worpswede' },
      ]);
    });

    it('should skip placeholder options', () => {
      const html = `
        <option value="">Bitte auswählen...</option>
        <option value="1">Test</option>
      `;

      const result = parseSelectOptions(html);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Test');
    });

    it('should return empty array for HTML without options', () => {
      const html = '<div>No options here</div>';

      const result = parseSelectOptions(html);

      expect(result).toEqual([]);
    });
  });

  describe('parseIcsContent', () => {
    it('should parse ICS content with single event', () => {
      const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260215
DTEND;VALUE=DATE:20260216
SUMMARY:Gelber Sack
END:VEVENT
END:VCALENDAR
      `;

      const result = parseIcsContent(icsContent);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2026-02-15');
      expect(result[0].fractionName).toBe('Gelber Sack');
      expect(result[0].fractionId).toBeTypeOf('number');
    });

    it('should parse ICS content with multiple events', () => {
      const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260210
SUMMARY:Hausmüll
END:VEVENT
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260215
SUMMARY:Gelber Sack
END:VEVENT
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260220
SUMMARY:Papiertonne
END:VEVENT
END:VCALENDAR
      `;

      const result = parseIcsContent(icsContent);

      expect(result).toHaveLength(3);
      // Should be sorted by date
      expect(result[0].date).toBe('2026-02-10');
      expect(result[1].date).toBe('2026-02-15');
      expect(result[2].date).toBe('2026-02-20');
    });

    it('should handle "Abfuhr:" prefix in SUMMARY', () => {
      const icsContent = `
BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260215
SUMMARY:Abfuhr: Biotonne
END:VEVENT
END:VCALENDAR
      `;

      const result = parseIcsContent(icsContent);

      expect(result[0].fractionName).toBe('Biotonne');
    });

    it('should handle escaped characters in SUMMARY', () => {
      const icsContent = `
BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260215
SUMMARY:Test\\, with comma
END:VEVENT
END:VCALENDAR
      `;

      const result = parseIcsContent(icsContent);

      expect(result[0].fractionName).toBe('Test, with comma');
    });

    it('should return empty array for invalid ICS content', () => {
      const icsContent = 'This is not valid ICS content';

      const result = parseIcsContent(icsContent);

      expect(result).toEqual([]);
    });

    it('should remove HTML warnings from ICS content', () => {
      const icsContent = `
BEGIN:VCALENDAR
<br>Warning message
<b>Bold warning</b>
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260215
SUMMARY:Test
END:VEVENT
END:VCALENDAR
      `;

      const result = parseIcsContent(icsContent);

      expect(result).toHaveLength(1);
      expect(result[0].fractionName).toBe('Test');
    });
  });

  describe('parseHtmlAppointments', () => {
    it('should parse appointments from AbfallIO widget HTML', () => {
      // Use the exact format returned by the AbfallIO API (single line, no spaces between divs)
      const html =
        '<div class="awk-ui-widget-html-monat">Februar 2026</div>' +
        '<div class="awk-ui-widget-html-termin awk-ui-widget-html-termin-mit-farbe-0"><div class="awk-ui-widget-html-termin-wtag">Mi.</div><div class="awk-ui-widget-html-termin-tag">04.</div><div class="awk-ui-widget-html-termin-farbe awk-ui-widget-html-termin-farbe-79"><span>&nbsp;</span></div><div class="awk-ui-widget-html-termin-bez">Altpapier Blaue Tonne</div></div>' +
        '<div class="awk-ui-widget-html-termin awk-ui-widget-html-termin-mit-farbe-0"><div class="awk-ui-widget-html-termin-wtag">Do.</div><div class="awk-ui-widget-html-termin-tag">05.</div><div class="awk-ui-widget-html-termin-farbe awk-ui-widget-html-termin-farbe-213"><span>&nbsp;</span></div><div class="awk-ui-widget-html-termin-bez">Gelbe Säcke</div></div>';

      const result = parseHtmlAppointments(html);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: '2026-02-04',
        fractionId: 79,
        fractionName: 'Altpapier Blaue Tonne',
      });
      expect(result[1]).toEqual({
        date: '2026-02-05',
        fractionId: 213,
        fractionName: 'Gelbe Säcke',
      });
    });

    it('should handle appointments across multiple months', () => {
      const html =
        '<div class="awk-ui-widget-html-monat">Februar 2026</div>' +
        '<div class="awk-ui-widget-html-termin"><div class="awk-ui-widget-html-termin-tag">28.</div><div class="awk-ui-widget-html-termin-farbe awk-ui-widget-html-termin-farbe-212"><span></span></div><div class="awk-ui-widget-html-termin-bez">Restmüll</div></div>' +
        '<div class="awk-ui-widget-html-monat">März 2026</div>' +
        '<div class="awk-ui-widget-html-termin"><div class="awk-ui-widget-html-termin-tag">05.</div><div class="awk-ui-widget-html-termin-farbe awk-ui-widget-html-termin-farbe-213"><span></span></div><div class="awk-ui-widget-html-termin-bez">Gelbe Säcke</div></div>';

      const result = parseHtmlAppointments(html);

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2026-02-28');
      expect(result[1].date).toBe('2026-03-05');
    });

    it('should handle year transitions', () => {
      const html =
        '<div class="awk-ui-widget-html-monat">Dezember 2026</div>' +
        '<div class="awk-ui-widget-html-termin"><div class="awk-ui-widget-html-termin-tag">30.</div><div class="awk-ui-widget-html-termin-farbe awk-ui-widget-html-termin-farbe-79"><span></span></div><div class="awk-ui-widget-html-termin-bez">Altpapier</div></div>' +
        '<div class="awk-ui-widget-html-monat">Januar 2027</div>' +
        '<div class="awk-ui-widget-html-termin"><div class="awk-ui-widget-html-termin-tag">07.</div><div class="awk-ui-widget-html-termin-farbe awk-ui-widget-html-termin-farbe-213"><span></span></div><div class="awk-ui-widget-html-termin-bez">Gelbe Säcke</div></div>';

      const result = parseHtmlAppointments(html);

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2026-12-30');
      expect(result[1].date).toBe('2027-01-07');
    });

    it('should return empty array for HTML without appointments', () => {
      const html = '<div>No appointments here</div>';

      const result = parseHtmlAppointments(html);

      expect(result).toEqual([]);
    });

    it('should sort appointments by date', () => {
      const html =
        '<div class="awk-ui-widget-html-monat">Februar 2026</div>' +
        '<div class="awk-ui-widget-html-termin"><div class="awk-ui-widget-html-termin-tag">20.</div><div class="awk-ui-widget-html-termin-farbe awk-ui-widget-html-termin-farbe-79"><span></span></div><div class="awk-ui-widget-html-termin-bez">Second</div></div>' +
        '<div class="awk-ui-widget-html-termin"><div class="awk-ui-widget-html-termin-tag">10.</div><div class="awk-ui-widget-html-termin-farbe awk-ui-widget-html-termin-farbe-213"><span></span></div><div class="awk-ui-widget-html-termin-bez">First</div></div>';

      const result = parseHtmlAppointments(html);

      expect(result).toHaveLength(2);
      expect(result[0].fractionName).toBe('First');
      expect(result[1].fractionName).toBe('Second');
    });
  });

  describe('extractFractionsFromAppointments', () => {
    it('should extract unique fractions from appointments', () => {
      const appointments = [
        { date: '2026-02-10', fractionName: 'Hausmüll', fractionId: 1 },
        { date: '2026-02-15', fractionName: 'Gelber Sack', fractionId: 2 },
        { date: '2026-02-20', fractionName: 'Hausmüll', fractionId: 1 },
        { date: '2026-02-25', fractionName: 'Papiertonne', fractionId: 3 },
      ];

      const result = extractFractionsFromAppointments(appointments);

      expect(result).toHaveLength(3);
      expect(result).toContainEqual({ id: 1, name: 'Hausmüll' });
      expect(result).toContainEqual({ id: 2, name: 'Gelber Sack' });
      expect(result).toContainEqual({ id: 3, name: 'Papiertonne' });
    });

    it('should return empty array for empty appointments', () => {
      const result = extractFractionsFromAppointments([]);

      expect(result).toEqual([]);
    });
  });
});
