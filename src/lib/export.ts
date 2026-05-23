import * as XLSX from "xlsx";

export function exportToExcel<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
  sheetName = "Sheet1"
) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

/**
 * Print-based PDF export. Opens a new window with styled HTML and triggers print.
 * This is the most reliable way to render Arabic / RTL PDFs from the browser.
 */
export function exportToPDF(opts: {
  title: string;
  subtitle?: string;
  columns: { key: string; label: string; width?: string }[];
  rows: Record<string, unknown>[];
  dir?: "rtl" | "ltr";
  lang?: "ar" | "en";
}) {
  const { title, subtitle, columns, rows, dir = "rtl", lang = "ar" } = opts;
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;

  const esc = (v: unknown) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const tableHead = columns
    .map((c) => `<th style="width:${c.width ?? "auto"}">${esc(c.label)}</th>`)
    .join("");
  const tableBody = rows
    .map(
      (r) =>
        `<tr>${columns.map((c) => `<td>${esc(r[c.key])}</td>`).join("")}</tr>`
    )
    .join("");

  win.document.write(`<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Cairo', -apple-system, system-ui, sans-serif; margin: 24px; color: #0a1d3a; }
  .header { border-bottom: 3px solid #c9a84c; padding-bottom: 12px; margin-bottom: 16px; }
  h1 { margin: 0 0 4px; font-size: 22px; color: #0a1d3a; }
  .subtitle { font-size: 12px; color: #555; }
  .meta { font-size: 11px; color: #777; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead { background: linear-gradient(135deg, #0a1d3a, #1a3a6e); color: #f0d78c; }
  th { padding: 8px 6px; text-align: ${dir === "rtl" ? "right" : "left"}; font-weight: 600; }
  td { padding: 6px; border-bottom: 1px solid #e5e7eb; text-align: ${dir === "rtl" ? "right" : "left"}; }
  tbody tr:nth-child(even) { background: #fafaf7; }
  .footer { margin-top: 18px; font-size: 10px; color: #999; text-align: center; }
  @media print {
    body { margin: 12mm; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <div class="header">
    <h1>${esc(title)}</h1>
    ${subtitle ? `<div class="subtitle">${esc(subtitle)}</div>` : ""}
    <div class="meta">${new Date().toLocaleString(lang === "ar" ? "ar-EG" : "en-US")} · ${rows.length} ${lang === "ar" ? "سجل" : "records"}</div>
  </div>
  <table>
    <thead><tr>${tableHead}</tr></thead>
    <tbody>${tableBody}</tbody>
  </table>
  <div class="footer">${esc(title)}</div>
  <script>
    window.addEventListener('load', () => { setTimeout(() => window.print(), 400); });
  </script>
</body>
</html>`);
  win.document.close();
}

/** Read an Excel or CSV file and return parsed rows + detected headers. */
export async function parseSpreadsheet(file: File): Promise<{
  headers: string[];
  rows: Record<string, unknown>[];
}> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  const headers = json.length ? Object.keys(json[0]) : [];
  return { headers, rows: json };
}

/** Smart fuzzy column matcher: returns the best header match for a target field. */
export function smartMatch(headers: string[], aliases: string[]): string | null {
  const norm = (s: string) =>
    s.toString().toLowerCase().trim().replace(/[\s_\-./\\]+/g, "");
  const normalized = headers.map((h) => ({ raw: h, n: norm(h) }));
  for (const alias of aliases) {
    const na = norm(alias);
    const exact = normalized.find((h) => h.n === na);
    if (exact) return exact.raw;
  }
  for (const alias of aliases) {
    const na = norm(alias);
    const partial = normalized.find((h) => h.n.includes(na) || na.includes(h.n));
    if (partial) return partial.raw;
  }
  return null;
}
