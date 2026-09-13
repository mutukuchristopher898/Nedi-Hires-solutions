// CSV generation, done properly rather than by joining with commas.
//
// Spreadsheet data is full of the characters that break naive CSV: Kenyan
// addresses contain commas, descriptions contain quotes and newlines, and a
// registration plate can begin with a character Excel treats as a formula.

/**
 * A value that begins with =, +, - or @ is executed as a formula when the file
 * is opened in Excel or Sheets. A field like `=HYPERLINK(...)` arriving from a
 * customer-supplied description then runs on the machine of whoever opens the
 * export. Prefixing with a single quote neutralises it while still reading
 * correctly in the cell.
 */
function neutraliseFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";

  const text = value instanceof Date ? value.toISOString() : String(value);
  const safe = neutraliseFormula(text);

  // Quote whenever the cell could otherwise be misread, doubling any quotes
  // inside it — the CSV escape, not a backslash.
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(","));
  }
  // CRLF, which is what every spreadsheet expects from a .csv.
  return lines.join("\r\n");
}

/**
 * Excel will not detect UTF-8 without a byte order mark, so Kenyan names with
 * accents arrive mangled. The BOM costs three bytes and fixes it everywhere.
 */
export function csvResponse(filename: string, body: string): Response {
  return new Response(`﻿${body}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      // An export is a point-in-time snapshot; caching one would hand back
      // yesterday's figures.
      "Cache-Control": "no-store",
    },
  });
}
