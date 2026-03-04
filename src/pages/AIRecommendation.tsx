import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import "./AIRecommendation.css";

interface AIResult {
  verdict: string;
  summary: string;
  bull_points: string[];
  bear_points: string[];
  risk_level: string; // "Low" | "Medium" | "High"
}

interface HistoryPoint {
  date: string;
  price: number;
}

interface CoinAnalysis {
  result: AIResult;
  history: HistoryPoint[];
  coinName: string;
  currentPrice: number;
  marketCap: number;
  volume24h: number;
  change30d: number | null;
  change200d: number | null;
}

export default function AIRecommendation() {
  const selectedIds = useSelector((s: RootState) => s.coins.selectedIds);
  const coins = useSelector((s: RootState) => s.coins.list);
  const selectedCoins = coins.filter((c) => selectedIds.includes(c.id));

  const [activeCoin, setActiveCoin] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CoinAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (coinId: string) => {
    setActiveCoin(coinId);
    setAnalysis(null);
    setError(null);
    setLoading(true);

    try {
      /* 1 — fetch market data + 30-day history in parallel */
      const [marketRes, historyRes] = await Promise.all([
        fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}?market_data=true&localization=false&tickers=false&community_data=false&developer_data=false`
        ),
        fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=30&interval=daily`
        ),
      ]);

      if (!marketRes.ok) throw new Error("Failed to fetch coin data from CoinGecko");
      if (!historyRes.ok) throw new Error("Failed to fetch price history from CoinGecko");

      const marketData = await marketRes.json();
      const historyData = await historyRes.json();
      const md = marketData.market_data;

      // Build history chart points
      const history: HistoryPoint[] = (
        historyData.prices as [number, number][]
      ).map(([ts, price]) => ({
        date: new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        price: parseFloat(price.toFixed(6)),
      }));

      const promptData = {
        name: marketData.name,
        usd_price_current: md.current_price.usd,
        usd_cap_market: md.market_cap.usd,
        usd_h24_volume: md.total_volume.usd,
        price_change_30d_pct: md.price_change_percentage_30d ?? "N/A",
        price_change_60d_pct: md.price_change_percentage_60d ?? "N/A",
        price_change_200d_pct: md.price_change_percentage_200d ?? "N/A",
        ath: md.ath.usd,
        ath_change_pct: md.ath_change_percentage.usd,
        circulating_supply: md.circulating_supply,
        max_supply: md.max_supply,
      };

      /* 2 — call NVIDIA NIM API */
      const apiKey = (import.meta.env.VITE_NVIDIA_API_KEY as string | undefined)?.trim();
      if (!apiKey || !apiKey.startsWith("nvapi-")) {
        setError("NVIDIA API key missing or invalid. Set VITE_NVIDIA_API_KEY=nvapi-... in .env and restart the dev server.");
        setLoading(false);
        return;
      }

      const aiRes = await fetch("/nvidia-api/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "meta/llama-3.1-70b-instruct",
          messages: [
            {
              role: "system",
              content:
                'You are a professional crypto investment analyst. Respond with ONLY a valid JSON object (no markdown, no code fences) with exactly these fields: ' +
                '"verdict" (string: "Buy" or "Do not buy"), ' +
                '"summary" (string: 2-3 sentences overview of this coin as an investment), ' +
                '"bull_points" (array of 3 strings: specific reasons to buy), ' +
                '"bear_points" (array of 3 strings: specific risks or reasons not to buy), ' +
                '"risk_level" (string: "Low", "Medium", or "High").',
            },
            {
              role: "user",
              content: `Analyze this cryptocurrency and give a detailed investment recommendation:\n${JSON.stringify(promptData, null, 2)}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!aiRes.ok) {
        const errBody = await aiRes.json().catch(() => ({}));
        const msg = (errBody as { error?: { message?: string } }).error?.message ?? aiRes.statusText;
        throw new Error(`NVIDIA API error ${aiRes.status}: ${msg}`);
      }

      const aiData = await aiRes.json();
      const content: string = aiData.choices[0].message.content ?? "";
      const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();

      let parsed: AIResult;
      try {
        const raw = JSON.parse(cleaned) as Partial<AIResult>;
        parsed = {
          verdict: raw.verdict ?? "Unknown",
          summary: raw.summary ?? cleaned,
          bull_points: Array.isArray(raw.bull_points) ? raw.bull_points : [],
          bear_points: Array.isArray(raw.bear_points) ? raw.bear_points : [],
          risk_level: raw.risk_level ?? "Medium",
        };
      } catch {
        const lower = cleaned.toLowerCase();
        const isBuy = lower.includes('"buy"') || (lower.includes("buy") && !lower.includes("do not buy"));
        parsed = {
          verdict: isBuy ? "Buy" : "Do not buy",
          summary: cleaned,
          bull_points: [],
          bear_points: [],
          risk_level: "Medium",
        };
      }

      setAnalysis({
        result: parsed,
        history,
        coinName: marketData.name,
        currentPrice: md.current_price.usd,
        marketCap: md.market_cap.usd,
        volume24h: md.total_volume.usd,
        change30d: md.price_change_percentage_30d ?? null,
        change200d: md.price_change_percentage_200d ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) =>
    n >= 1e9
      ? `$${(n / 1e9).toFixed(2)}B`
      : n >= 1e6
      ? `$${(n / 1e6).toFixed(2)}M`
      : `$${n.toLocaleString()}`;

  const fmtPrice = (n: number) =>
    n < 1 ? `$${n.toFixed(6)}` : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (selectedCoins.length === 0) {
    return (
      <div className="ai-page">
        <p className="ai-empty">No coins selected. Go to <strong>Home</strong> and toggle some coins.</p>
      </div>
    );
  }

  const isBuy = analysis?.result.verdict === "Buy";
  const accentColor = isBuy ? "#2a9d2a" : "#e05c5c";

  return (
    <div className="ai-page">
      <h2>AI Recommendation</h2>
      <p className="ai-subtitle">Powered by NVIDIA NIM · Llama 3.1 70B</p>

      <div className="ai-coin-list">
        {selectedCoins.map((c) => (
          <button
            key={c.id}
            className={`ai-coin-btn ${activeCoin === c.id ? "active" : ""}`}
            onClick={() => handleAnalyze(c.id)}
          >
            <img src={c.image} alt={c.symbol} className="ai-coin-btn-img" />
            {c.symbol} — {c.name}
          </button>
        ))}
      </div>

      {loading && (
        <div className="ai-loading-block">
          <div className="ai-spinner" />
          <p>Analyzing with NVIDIA AI…</p>
        </div>
      )}
      {error && <p className="ai-error">{error}</p>}

      {analysis && (
        <div className="ai-result">

          {/* ── Header ── */}
          <div className="ai-result-header">
            <span className={`ai-verdict-badge ${isBuy ? "buy" : "no-buy"}`}>
              {isBuy ? "✅ Buy" : "❌ Do Not Buy"}
            </span>
            <span className={`ai-risk-badge risk-${analysis.result.risk_level.toLowerCase()}`}>
              Risk: {analysis.result.risk_level}
            </span>
          </div>

          {/* ── Summary ── */}
          <p className="ai-summary">{analysis.result.summary}</p>

          {/* ── Stats row ── */}
          <div className="ai-stats-row">
            <div className="ai-stat">
              <span className="ai-stat-label">Price</span>
              <span className="ai-stat-value">{fmtPrice(analysis.currentPrice)}</span>
            </div>
            <div className="ai-stat">
              <span className="ai-stat-label">Market Cap</span>
              <span className="ai-stat-value">{fmt(analysis.marketCap)}</span>
            </div>
            <div className="ai-stat">
              <span className="ai-stat-label">24h Volume</span>
              <span className="ai-stat-value">{fmt(analysis.volume24h)}</span>
            </div>
            <div className="ai-stat">
              <span className="ai-stat-label">30d Change</span>
              <span className={`ai-stat-value ${(analysis.change30d ?? 0) >= 0 ? "positive" : "negative"}`}>
                {analysis.change30d != null ? `${analysis.change30d.toFixed(2)}%` : "N/A"}
              </span>
            </div>
            <div className="ai-stat">
              <span className="ai-stat-label">200d Change</span>
              <span className={`ai-stat-value ${(analysis.change200d ?? 0) >= 0 ? "positive" : "negative"}`}>
                {analysis.change200d != null ? `${analysis.change200d.toFixed(2)}%` : "N/A"}
              </span>
            </div>
          </div>

          {/* ── 30-day price chart ── */}
          <div className="ai-chart-section">
            <h4>30-Day Price History — {analysis.coinName}</h4>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={analysis.history} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accentColor} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                  width={80}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : v < 1 ? `$${v.toFixed(4)}` : `$${v.toFixed(2)}`
                  }
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}
                  labelStyle={{ color: "var(--text-muted)" }}
                  itemStyle={{ color: accentColor }}
                  formatter={(v) => {
                    const n = Number(v);
                    return [`$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`, "Price"] as [string, string];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={accentColor}
                  strokeWidth={2}
                  fill="url(#aiGrad)"
                  dot={false}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ── Bull / Bear points ── */}
          <div className="ai-points-row">
            {analysis.result.bull_points.length > 0 && (
              <div className="ai-points bull">
                <h4>🟢 Reasons to Buy</h4>
                <ul>
                  {analysis.result.bull_points.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}
            {analysis.result.bear_points.length > 0 && (
              <div className="ai-points bear">
                <h4>🔴 Risks / Reasons to Avoid</h4>
                <ul>
                  {analysis.result.bear_points.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
