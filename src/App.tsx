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
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

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
  const [error, setError] = useState<string | null>(null);

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

function toPayload(form: TradeForm) {
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
