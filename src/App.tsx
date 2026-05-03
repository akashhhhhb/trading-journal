import {
  Activity,
  CalendarDays,
  Edit3,
  Moon,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sun,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { readSheet } from "read-excel-file/browser";

type Side = "LONG" | "SHORT";
type Theme = "light" | "dark";

type Trade = {
  id: string;
  symbol: string;
  side: Side;
  entryDate: string;
  exitDate?: string | null;
  entryPrice: number;
  exitPrice?: number | null;
  quantity: number;
  fees: number;
  strategy?: string | null;
  setup?: string | null;
  tags: string[];
  notes?: string | null;
  emotion?: string | null;
  marketCondition?: string | null;
  riskAmount?: number | null;
  rating?: number | null;
  grossPnl?: number | null;
  netPnl?: number | null;
  rMultiple?: number | null;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  updatedAt: string;
};

type TradeForm = {
  symbol: string;
  side: Side;
  entryDate: string;
  exitDate: string;
  entryPrice: string;
  exitPrice: string;
  quantity: string;
  fees: string;
  strategy: string;
  setup: string;
  tags: string;
  notes: string;
  emotion: string;
  marketCondition: string;
  riskAmount: string;
  rating: string;
};

type Stats = {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  grossPnl: number;
  netPnl: number;
  averageR: number;
  bestTrade: number;
  worstTrade: number;
};

type TradePayload = {
  symbol: string;
  side: Side;
  entryDate: string;
  exitDate: string | null;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  fees: number;
  strategy: string | null;
  setup: string | null;
  tags: string[];
  notes: string | null;
  emotion: string | null;
  marketCondition: string | null;
  riskAmount: number | null;
  rating: number | null;
};

const emptyForm: TradeForm = {
  symbol: "",
  side: "LONG",
  entryDate: new Date().toISOString().slice(0, 10),
  exitDate: "",
  entryPrice: "",
  exitPrice: "",
  quantity: "",
  fees: "0",
  strategy: "",
  setup: "",
  tags: "",
  notes: "",
  emotion: "",
  marketCondition: "",
  riskAmount: "",
  rating: "",
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => initialTheme());
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [form, setForm] = useState<TradeForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sideFilter, setSideFilter] = useState<"ALL" | Side>("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void loadJournal();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("trading-journal-theme", theme);
  }, [theme]);

  const filteredTrades = useMemo(() => {
    const normalized = query.trim().toUpperCase();
    return trades.filter((trade) => {
      const sideMatch = sideFilter === "ALL" || trade.side === sideFilter;
      const queryMatch =
        normalized.length === 0 ||
        trade.symbol.toUpperCase().includes(normalized) ||
        (trade.strategy ?? "").toUpperCase().includes(normalized) ||
        trade.tags.some((tag) => tag.toUpperCase().includes(normalized));
      return sideMatch && queryMatch;
    });
  }, [query, sideFilter, trades]);

  async function loadJournal() {
    setLoading(true);
    setError(null);
    try {
      const [tradesResponse, statsResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/trades`),
        fetch(`${apiBaseUrl}/api/trades/stats`),
      ]);

      if (!tradesResponse.ok || !statsResponse.ok) {
        throw new Error("The journal API returned an error.");
      }

      setTrades(await tradesResponse.json());
      setStats(await statsResponse.json());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not reach the journal API.");
    } finally {
      setLoading(false);
    }
  }

  async function submitTrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const payload = toPayload(form);

    try {
      const response = await fetch(`${apiBaseUrl}/api/trades${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? "Trade could not be saved.");
      }

      setForm({ ...emptyForm, entryDate: new Date().toISOString().slice(0, 10) });
      setEditingId(null);
      setImportMessage(null);
      await loadJournal();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Trade could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTrade(id: string) {
    setError(null);
    const response = await fetch(`${apiBaseUrl}/api/trades/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Trade could not be deleted.");
      return;
    }
    await loadJournal();
  }

  async function importTradesFromExcel(file: File) {
    setImporting(true);
    setError(null);
    setImportMessage(null);

    try {
      const rows = (await readSheet(file)) as unknown[][];
      const payloads = rowsToTradePayloads(rows);
      const response = await fetch(`${apiBaseUrl}/api/trades/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloads),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? "Excel trades could not be imported.");
      }

      const importedTrades = (await response.json()) as Trade[];
      setImportMessage(`Imported ${importedTrades.length} trade${importedTrades.length === 1 ? "" : "s"}.`);
      await loadJournal();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Excel trades could not be imported.");
    } finally {
      setImporting(false);
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  }

  function editTrade(trade: Trade) {
    setEditingId(trade.id);
    setForm({
      symbol: trade.symbol,
      side: trade.side,
      entryDate: trade.entryDate,
      exitDate: trade.exitDate ?? "",
      entryPrice: String(trade.entryPrice),
      exitPrice: trade.exitPrice == null ? "" : String(trade.exitPrice),
      quantity: String(trade.quantity),
      fees: String(trade.fees ?? 0),
      strategy: trade.strategy ?? "",
      setup: trade.setup ?? "",
      tags: trade.tags.join(", "),
      notes: trade.notes ?? "",
      emotion: trade.emotion ?? "",
      marketCondition: trade.marketCondition ?? "",
      riskAmount: trade.riskAmount == null ? "" : String(trade.riskAmount),
      rating: trade.rating == null ? "" : String(trade.rating),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ ...emptyForm, entryDate: new Date().toISOString().slice(0, 10) });
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Personal trading journal</p>
          <h1>Trading Journal</h1>
        </div>
        <div className="topbar-actions">
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          >
            <span className={theme === "light" ? "active" : ""}>
              <Sun size={16} />
            </span>
            <span className={theme === "dark" ? "active" : ""}>
              <Moon size={16} />
            </span>
          </button>
          <button className="icon-button" type="button" onClick={loadJournal} aria-label="Refresh journal">
            <RefreshCw size={18} />
          </button>
        </div>
      </section>

      {error && (
        <div className="alert" role="alert">
          <Activity size={18} />
          <span>{error}</span>
        </div>
      )}

      {importMessage && (
        <div className="success-alert" role="status">
          <Upload size={18} />
          <span>{importMessage}</span>
        </div>
      )}

      <section className="stats-grid" aria-label="Journal statistics">
        <Stat label="Net P/L" value={money(stats?.netPnl ?? 0)} tone={(stats?.netPnl ?? 0) >= 0 ? "positive" : "negative"} />
        <Stat label="Win rate" value={`${number(stats?.winRate ?? 0)}%`} />
        <Stat label="Closed" value={String(stats?.closedTrades ?? 0)} />
        <Stat label="Open" value={String(stats?.openTrades ?? 0)} />
        <Stat label="Average R" value={number(stats?.averageR ?? 0)} />
        <Stat label="Best / Worst" value={`${money(stats?.bestTrade ?? 0)} / ${money(stats?.worstTrade ?? 0)}`} />
      </section>

      <section className="journal-grid">
        <form className="trade-form" onSubmit={submitTrade}>
          <div className="section-heading">
            <h2>{editingId ? "Edit Trade" : "New Trade"}</h2>
            {editingId && (
              <button className="ghost-button" type="button" onClick={cancelEdit}>
                <X size={16} />
                Cancel
              </button>
            )}
          </div>

          <div className="form-grid">
            <label>
              <span>Symbol</span>
              <input
                required
                value={form.symbol}
                onChange={(event) => setFormField("symbol", event.target.value.toUpperCase())}
                placeholder="NIFTY, AAPL, BTC"
              />
            </label>
            <label>
              <span>Side</span>
              <select value={form.side} onChange={(event) => setFormField("side", event.target.value as Side)}>
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
            </label>
            <label>
              <span>Entry date</span>
              <input required type="date" value={form.entryDate} onChange={(event) => setFormField("entryDate", event.target.value)} />
            </label>
            <label>
              <span>Exit date</span>
              <input type="date" value={form.exitDate} onChange={(event) => setFormField("exitDate", event.target.value)} />
            </label>
            <label>
              <span>Entry price</span>
              <input required min="0" step="0.01" type="number" value={form.entryPrice} onChange={(event) => setFormField("entryPrice", event.target.value)} />
            </label>
            <label>
              <span>Exit price</span>
              <input min="0" step="0.01" type="number" value={form.exitPrice} onChange={(event) => setFormField("exitPrice", event.target.value)} />
            </label>
            <label>
              <span>Quantity</span>
              <input required min="0.0001" step="0.0001" type="number" value={form.quantity} onChange={(event) => setFormField("quantity", event.target.value)} />
            </label>
            <label>
              <span>Fees</span>
              <input min="0" step="0.01" type="number" value={form.fees} onChange={(event) => setFormField("fees", event.target.value)} />
            </label>
            <label>
              <span>Risk amount</span>
              <input min="0" step="0.01" type="number" value={form.riskAmount} onChange={(event) => setFormField("riskAmount", event.target.value)} />
            </label>
            <label>
              <span>Rating</span>
              <input max="5" min="1" step="1" type="number" value={form.rating} onChange={(event) => setFormField("rating", event.target.value)} />
            </label>
            <label>
              <span>Strategy</span>
              <input value={form.strategy} onChange={(event) => setFormField("strategy", event.target.value)} placeholder="Breakout" />
            </label>
            <label>
              <span>Setup</span>
              <input value={form.setup} onChange={(event) => setFormField("setup", event.target.value)} placeholder="Retest, gap, pullback" />
            </label>
            <label>
              <span>Emotion</span>
              <input value={form.emotion} onChange={(event) => setFormField("emotion", event.target.value)} placeholder="Calm, rushed, patient" />
            </label>
            <label>
              <span>Market</span>
              <input value={form.marketCondition} onChange={(event) => setFormField("marketCondition", event.target.value)} placeholder="Trending, choppy" />
            </label>
            <label className="span-2">
              <span>Tags</span>
              <input value={form.tags} onChange={(event) => setFormField("tags", event.target.value)} placeholder="earnings, scalp, swing" />
            </label>
            <label className="span-2">
              <span>Notes</span>
              <textarea value={form.notes} onChange={(event) => setFormField("notes", event.target.value)} rows={4} />
            </label>
          </div>

          <button className="primary-button" type="submit" disabled={saving}>
            {editingId ? <Save size={18} /> : <Plus size={18} />}
            {saving ? "Saving" : editingId ? "Save Trade" : "Add Trade"}
          </button>
        </form>

        <section className="trade-ledger">
          <div className="ledger-toolbar">
            <div className="search-control">
              <Search size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search symbol, strategy, tag" />
            </div>
            <label className="import-button">
              <Upload size={17} />
              {importing ? "Importing" : "Import Excel"}
              <input
                ref={importInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={importing}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void importTradesFromExcel(file);
                  }
                }}
              />
            </label>
            <div className="segmented" aria-label="Side filter">
              {(["ALL", "LONG", "SHORT"] as const).map((side) => (
                <button
                  className={sideFilter === side ? "active" : ""}
                  key={side}
                  type="button"
                  onClick={() => setSideFilter(side)}
                >
                  {side === "ALL" ? "All" : titleCase(side)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="empty-state">Loading journal</div>
          ) : filteredTrades.length === 0 ? (
            <div className="empty-state">No trades found</div>
          ) : (
            <div className="trade-list">
              {filteredTrades.map((trade) => (
                <article className="trade-row" key={trade.id}>
                  <div className="trade-main">
                    <div>
                      <div className="symbol-line">
                        <strong>{trade.symbol}</strong>
                        <span className={`side-pill ${trade.side.toLowerCase()}`}>{titleCase(trade.side)}</span>
                        <span className="status-pill">{titleCase(trade.status)}</span>
                      </div>
                      <div className="meta-line">
                        <CalendarDays size={15} />
                        {trade.entryDate}
                        {trade.exitDate ? ` to ${trade.exitDate}` : ""}
                      </div>
                    </div>
                    <div className={`pnl ${Number(trade.netPnl ?? 0) >= 0 ? "positive" : "negative"}`}>
                      {trade.status === "OPEN" ? "Open" : money(trade.netPnl ?? 0)}
                    </div>
                  </div>

                  <dl className="trade-facts">
                    <div>
                      <dt>Entry</dt>
                      <dd>{number(trade.entryPrice)}</dd>
                    </div>
                    <div>
                      <dt>Exit</dt>
                      <dd>{trade.exitPrice == null ? "-" : number(trade.exitPrice)}</dd>
                    </div>
                    <div>
                      <dt>Qty</dt>
                      <dd>{number(trade.quantity)}</dd>
                    </div>
                    <div>
                      <dt>R</dt>
                      <dd>{trade.rMultiple == null ? "-" : number(trade.rMultiple)}</dd>
                    </div>
                  </dl>

                  <div className="note-line">{[trade.strategy, trade.setup, trade.notes].filter(Boolean).join(" | ")}</div>

                  {trade.tags.length > 0 && (
                    <div className="tag-list">
                      {trade.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="row-actions">
                    <button className="icon-text-button" type="button" onClick={() => editTrade(trade)}>
                      <Edit3 size={16} />
                      Edit
                    </button>
                    <button className="danger-button" type="button" onClick={() => deleteTrade(trade.id)}>
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );

  function setFormField<Key extends keyof TradeForm>(key: Key, value: TradeForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <div className={`stat ${tone ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function toPayload(form: TradeForm): TradePayload {
  return {
    symbol: form.symbol.trim().toUpperCase(),
    side: form.side,
    entryDate: form.entryDate,
    exitDate: nullable(form.exitDate),
    entryPrice: numeric(form.entryPrice),
    exitPrice: nullableNumber(form.exitPrice),
    quantity: numeric(form.quantity),
    fees: numeric(form.fees || "0"),
    strategy: nullable(form.strategy),
    setup: nullable(form.setup),
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    notes: nullable(form.notes),
    emotion: nullable(form.emotion),
    marketCondition: nullable(form.marketCondition),
    riskAmount: nullableNumber(form.riskAmount),
    rating: nullableNumber(form.rating),
  };
}

function rowsToTradePayloads(rows: unknown[][]): TradePayload[] {
  const nonEmptyRows = rows.filter((row) => row.some((cell) => cellToString(cell).length > 0));
  if (nonEmptyRows.length < 2) {
    throw new Error("Excel sheet must include a header row and at least one trade row.");
  }

  const headers = nonEmptyRows[0].map((cell) => normalizeHeader(cellToString(cell)));
  const dataRows = nonEmptyRows.slice(1);
  const errors: string[] = [];
  const payloads = dataRows
    .map((row, index) => {
      const rowNumber = index + 2;
      try {
        return rowToPayload(headers, row, rowNumber);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `Row ${rowNumber} could not be parsed.`);
        return null;
      }
    })
    .filter((payload): payload is TradePayload => payload !== null);

  if (errors.length > 0) {
    throw new Error(errors.slice(0, 5).join(" "));
  }

  if (payloads.length === 0) {
    throw new Error("No valid trades were found in the Excel sheet.");
  }

  return payloads;
}

function rowToPayload(headers: string[], row: unknown[], rowNumber: number): TradePayload {
  const symbol = requiredText(readByAliases(headers, row, ["symbol", "ticker", "instrument", "scrip"]), "Symbol", rowNumber).toUpperCase();
  const side = parseSide(requiredText(readByAliases(headers, row, ["side", "direction", "tradeType", "trade"]), "Side", rowNumber), rowNumber);
  const entryDate = requiredDate(readByAliases(headers, row, ["entryDate", "entryDay", "date", "tradeDate"]), "Entry date", rowNumber);
  const entryPrice = requiredNumber(readByAliases(headers, row, ["entryPrice", "buyPrice", "openPrice"]), "Entry price", rowNumber);
  const quantity = requiredNumber(readByAliases(headers, row, ["quantity", "qty", "shares", "lots", "size"]), "Quantity", rowNumber);

  return {
    symbol,
    side,
    entryDate,
    exitDate: optionalDate(readByAliases(headers, row, ["exitDate", "exitDay", "sellDate", "closeDate"])),
    entryPrice,
    exitPrice: optionalNumber(readByAliases(headers, row, ["exitPrice", "sellPrice", "closePrice"])),
    quantity,
    fees: optionalNumber(readByAliases(headers, row, ["fees", "fee", "brokerage", "charges", "commission"])) ?? 0,
    strategy: optionalText(readByAliases(headers, row, ["strategy", "system"])),
    setup: optionalText(readByAliases(headers, row, ["setup", "pattern"])),
    tags: optionalText(readByAliases(headers, row, ["tags", "tag"]))
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean) ?? [],
    notes: optionalText(readByAliases(headers, row, ["notes", "note", "journal"])),
    emotion: optionalText(readByAliases(headers, row, ["emotion", "psychology", "mindset"])),
    marketCondition: optionalText(readByAliases(headers, row, ["marketCondition", "market", "condition"])),
    riskAmount: optionalNumber(readByAliases(headers, row, ["riskAmount", "risk", "plannedRisk"])),
    rating: optionalNumber(readByAliases(headers, row, ["rating", "grade", "score"])),
  };
}

function readByAliases(headers: string[], row: unknown[], aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeHeader);
  const columnIndex = headers.findIndex((header) => normalizedAliases.includes(header));
  return columnIndex === -1 ? undefined : row[columnIndex];
}

function requiredText(value: unknown, field: string, rowNumber: number) {
  const text = optionalText(value);
  if (!text) {
    throw new Error(`Row ${rowNumber}: ${field} is required.`);
  }
  return text;
}

function optionalText(value: unknown) {
  const text = cellToString(value);
  return text.length === 0 ? null : text;
}

function requiredNumber(value: unknown, field: string, rowNumber: number) {
  const numberValue = optionalNumber(value);
  if (numberValue == null || !Number.isFinite(numberValue)) {
    throw new Error(`Row ${rowNumber}: ${field} must be a number.`);
  }
  return numberValue;
}

function optionalNumber(value: unknown) {
  if (value == null || value === "") {
    return null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = Number(cellToString(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function requiredDate(value: unknown, field: string, rowNumber: number) {
  const date = optionalDate(value);
  if (!date) {
    throw new Error(`Row ${rowNumber}: ${field} is required.`);
  }
  return date;
}

function optionalDate(value: unknown) {
  if (value == null || value === "") {
    return null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number") {
    const excelDate = new Date(Math.round((value - 25569) * 86400 * 1000));
    return Number.isNaN(excelDate.getTime()) ? null : excelDate.toISOString().slice(0, 10);
  }

  const text = cellToString(value);
  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
  }

  const indianDateMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (indianDateMatch) {
    return `${indianDateMatch[3]}-${indianDateMatch[2].padStart(2, "0")}-${indianDateMatch[1].padStart(2, "0")}`;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function parseSide(value: string, rowNumber: number): Side {
  const normalized = value.trim().toUpperCase();
  if (["LONG", "BUY", "B"].includes(normalized)) {
    return "LONG";
  }
  if (["SHORT", "SELL", "S"].includes(normalized)) {
    return "SHORT";
  }
  throw new Error(`Row ${rowNumber}: Side must be LONG or SHORT.`);
}

function cellToString(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function normalizeHeader(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function nullable(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function numeric(value: string) {
  return Number(value);
}

function nullableNumber(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : Number(trimmed);
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function number(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(value);
}

function titleCase(value: string) {
  return value.toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
}

function initialTheme(): Theme {
  const storedTheme = localStorage.getItem("trading-journal-theme");
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
