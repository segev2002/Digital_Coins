import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import "./Reports.css";

const COLORS = ["#2a9d2a", "#d32f2f", "#2a6fd6", "#f5a623", "#8e44ad"];

interface DataPoint {
  time: string;
  [symbol: string]: string | number;
}

/** Compute a tight domain with 0.5% padding so tiny moves are visible */
function tightDomain(data: DataPoint[], sym: string): [number, number] {
  const vals = data.map((d) => d[sym] as number).filter((v) => v > 0);
  if (vals.length < 2) return [0, 1];
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const pad = (max - min) * 0.5 || min * 0.001;
  return [min - pad, max + pad];
}

export default function Reports() {
  const selectedIds = useSelector((s: RootState) => s.coins.selectedIds);
  const coins = useSelector((s: RootState) => s.coins.list);
  const selectedCoins = coins.filter((c) => selectedIds.includes(c.id));
  const symbols = selectedCoins.map((c) => c.symbol);

  const [data, setData] = useState<DataPoint[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setData([]);
    if (symbols.length === 0) return;

    const poll = async () => {
      try {
        const res = await fetch(
          `https://min-api.cryptocompare.com/data/pricemulti?tsyms=USD&fsyms=${symbols.join(",")}`
        );
        const json = await res.json();
        const now = new Date().toLocaleTimeString();
        const point: DataPoint = { time: now };
        for (const sym of symbols) {
          point[sym] = json[sym]?.USD ?? 0;
        }
        setData((prev) => [...prev.slice(-59), point]);
      } catch {
        /* skip failed tick */
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds.join(",")]);

  if (symbols.length === 0)
    return (
      <div className="reports-page">
        <p className="reports-empty">
          No coins selected. Go to <strong>Home</strong> and toggle some coins.
        </p>
      </div>
    );

  return (
    <div className="reports-page">
      <h2>Real-Time Price — USD</h2>
      <div className="reports-grid">
        {symbols.map((sym, i) => {
          const coin = selectedCoins[i];
          const latestPrice =
            data.length > 0 ? (data[data.length - 1][sym] as number) : null;
          const domain =
            data.length >= 2
              ? tightDomain(data, sym)
              : (["auto", "auto"] as const);
          return (
            <div className="reports-chart-card" key={sym}>
              <div className="reports-chart-header">
                {coin?.image && (
                  <img
                    src={coin.image}
                    alt={sym}
                    className="reports-coin-img"
                  />
                )}
                <span
                  className="reports-coin-sym"
                  style={{ color: COLORS[i % COLORS.length] }}
                >
                  {sym.toUpperCase()}
                </span>
                {latestPrice !== null && (
                  <span className="reports-price">
                    ${latestPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })}
                  </span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={data}
                  margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--grid-line)"
                  />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    interval="preserveStartEnd"
                    tickFormatter={(v: string) =>
                      v.split(":").slice(1).join(":")
                    }
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    width={82}
                    tickCount={8}
                    domain={domain}
                    tickFormatter={(v: number) => {
                      if (v >= 1000) return `$${(v / 1000).toFixed(2)}k`;
                      if (v < 1) return `$${v.toFixed(4)}`;
                      return `$${v.toFixed(2)}`;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: "var(--text-muted)" }}
                    itemStyle={{ color: COLORS[i % COLORS.length] }}
                    formatter={(v) => {
                      const n = Number(v);
                      return [
                        `$${n.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}`,
                        sym.toUpperCase(),
                      ];
                    }}
                    labelFormatter={(l) => `Time: ${String(l)}`}
                  />
                  <Line
                    type="monotone"
                    dataKey={sym}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}
