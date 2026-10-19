import { Download, FileUp, TriangleAlert } from "lucide-react";
import { useState, type ReactNode } from "react";
import { downloadCsv } from "../lib/csv";
import type { ImportProblem, ImportResult } from "../lib/csvImport";
import { Sheet } from "./ui";

const PREVIEW_ROWS = 8;
const SHOWN_PROBLEMS = 8;

/**
 * Pick a CSV, see what will be imported and what can't be, then import.
 * `parse` turns the file's text into items; `renderRow` shows one item in the preview.
 */
export function CsvImportSheet<T>({
  title,
  intro,
  columns,
  templateName,
  template,
  parse,
  renderRow,
  headings,
  note,
  onImport,
  onClose,
}: {
  title: string;
  intro: ReactNode;
  columns: Array<{ name: string; hint: string }>;
  templateName: string;
  template: () => string;
  parse: (text: string) => ImportResult<T> | { error: string };
  renderRow: (item: T) => ReactNode[];
  headings: string[];
  /** Extra line shown above the import button, e.g. what will be replaced. */
  note?: (items: T[]) => ReactNode;
  onImport: (items: T[]) => void;
  onClose: () => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult<T> | { error: string } | null>(null);

  const read = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    if (file.size > 1_000_000) {
      setResult({ error: "That file is over 1 MB. Split it into smaller files." });
      return;
    }
    try {
      setResult(parse(await file.text()));
    } catch {
      setResult({ error: "Couldn't read that file. Save it as CSV (comma separated) and try again." });
    }
  };

  const ok = result && !("error" in result) ? result : null;
  const items = ok ? ok.items : [];

  return (
    <Sheet title={title} onClose={onClose}>
      <p className="small">{intro}</p>
      <ul className="csv-columns small">
        {columns.map((c) => (
          <li key={c.name}><code>{c.name}</code> <span className="muted">{c.hint}</span></li>
        ))}
      </ul>
      <div className="row csv-actions">
        <label className="btn btn-primary btn-small file-btn">
          <FileUp size={16} aria-hidden /> {fileName ? "Choose another file" : "Choose CSV file"}
          <input type="file" accept=".csv,text/csv,.txt,text/plain" onChange={(e) => { void read(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        <button className="btn btn-secondary btn-small" onClick={() => downloadCsv(templateName, template())}>
          <Download size={16} aria-hidden /> Download template
        </button>
      </div>
      {fileName && <p className="muted small">{fileName}</p>}

      {result && "error" in result && <div className="banner banner-warn" role="alert">{result.error}</div>}

      {ok && (
        <>
          <p className="csv-summary" role="status">
            <strong>{items.length}</strong> {items.length === 1 ? "row" : "rows"} ready to import
            {ok.problems.length > 0 && <> · <span className="error">{ok.problems.length} with problems</span></>}
          </p>
          {ok.problems.length > 0 && <Problems problems={ok.problems} />}
          {items.length > 0 && (
            <div className="table-wrap csv-preview">
              <table className="table data-table">
                <thead><tr><th>Line</th>{headings.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {items.slice(0, PREVIEW_ROWS).map((it) => {
                    const line = (it as T & { line: number }).line;
                    return <tr key={line}><td className="muted">{line}</td>{renderRow(it).map((c, i) => <td key={i}>{c}</td>)}</tr>;
                  })}
                </tbody>
              </table>
              {items.length > PREVIEW_ROWS && <p className="muted small">…and {items.length - PREVIEW_ROWS} more.</p>}
            </div>
          )}
          {items.length > 0 && note?.(items)}
          <button className="btn btn-primary btn-block" disabled={items.length === 0} onClick={() => { onImport(items); onClose(); }}>
            Import {items.length} {items.length === 1 ? "row" : "rows"}
          </button>
          {ok.problems.length > 0 && items.length > 0 && <p className="small muted center">Rows with problems are skipped.</p>}
        </>
      )}
    </Sheet>
  );
}

function Problems({ problems }: { problems: ImportProblem[] }) {
  return (
    <ul className="csv-problems small">
      {problems.slice(0, SHOWN_PROBLEMS).map((p, i) => (
        <li key={i}><TriangleAlert size={14} aria-hidden /> <span><strong>Line {p.line}:</strong> {p.message}</span></li>
      ))}
      {problems.length > SHOWN_PROBLEMS && <li className="muted">…and {problems.length - SHOWN_PROBLEMS} more.</li>}
    </ul>
  );
}

/** Sends items in batches the server accepts in one call. */
export function inBatches<T>(items: T[], size: number, send: (batch: T[]) => void) {
  for (let i = 0; i < items.length; i += size) send(items.slice(i, i + size));
}
