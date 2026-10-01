/**
 * Minimal RFC 4180 CSV reader (no dependencies).
 *
 * Handles: quoted fields, "" escapes inside quotes, commas / CR / LF inside
 * quotes, CRLF or LF line endings, a UTF-8 BOM, a trailing newline, and blank
 * lines (skipped). Headers are normalised so every alias maps to one key.
 */

/** Parse CSV text into rows of raw string cells. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let fieldStarted = false; // distinguishes an empty line from a line with one empty field
  let i = 0;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    // A blank line produces [''], which we drop.
    if (!(row.length === 1 && row[0] === '' && !fieldStarted)) rows.push(row);
    row = [];
    fieldStarted = false;
  };

  while (i < src.length) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'; // escaped quote
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      fieldStarted = true;
      i++;
    } else if (ch === ',') {
      fieldStarted = true;
      endField();
      i++;
    } else if (ch === '\r') {
      endRow();
      i += src[i + 1] === '\n' ? 2 : 1;
    } else if (ch === '\n') {
      endRow();
      i++;
    } else {
      field += ch;
      fieldStarted = true;
      i++;
    }
  }
  // Final row without a trailing newline.
  if (field !== '' || row.length > 0 || fieldStarted) endRow();
  return rows;
}

/**
 * Normalise a header cell: strip BOM, trim, lowercase, and collapse runs of
 * spaces / dashes / dots into one underscore. camelCase is split first, so
 * "roadClass", "Road Class" and "road-class" all become "road_class".
 */
export function normalizeHeader(h: string): string {
  return h
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2') // "weeklyLFuel" -> weekly_L_Fuel
    .toLowerCase()
    .replace(/[\s\-.]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/** A CSV record keyed by normalised header. */
export type CsvRecord = Record<string, string>;

/**
 * Parse CSV text into records keyed by normalised header.
 * Cells are trimmed; rows shorter than the header get '' for missing cells.
 */
export function readCsvRecords(text: string): { headers: string[]; records: CsvRecord[] } {
  const rows = parseCsv(text);
  if (rows.length === 0) return { headers: [], records: [] };
  const headers = rows[0].map(normalizeHeader);
  const records = rows.slice(1).map((cells) => {
    const rec: CsvRecord = {};
    headers.forEach((h, idx) => {
      if (h && !(h in rec)) rec[h] = (cells[idx] ?? '').trim();
    });
    return rec;
  });
  return { headers, records };
}

/**
 * Return the first non-blank value among the alias columns (already
 * normalised names). Returns undefined when none of the columns has a value.
 */
export function pick(rec: CsvRecord, aliases: readonly string[]): string | undefined {
  for (const a of aliases) {
    const v = rec[a];
    if (v !== undefined && v !== '') return v;
  }
  return undefined;
}

/** True when at least one of the alias columns is present in the header row. */
export function hasColumn(headers: readonly string[], aliases: readonly string[]): boolean {
  return aliases.some((a) => headers.includes(a));
}
