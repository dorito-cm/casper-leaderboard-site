{/* DEPLOY TEST 1 */}
"use client";

import React, { useEffect, useMemo, useState } from "react";

type Row = {
  rank?: number;
  public_key_short?: string;
  total_cspr?: string | number;
  liquid_cspr?: string | number;
  staked_cspr?: string | number;
  public_key?: string;
  cspr_live_url?: string;
};

type Payload = {
  network?: string;
  updated_at?: string;
  rows?: Row[];
  errors?: any[];
};

const REFRESH_SECONDS = Number(process.env.NEXT_PUBLIC_REFRESH_SECONDS ?? "60"); // 60s default
const JSON_URL = process.env.NEXT_PUBLIC_LEADERBOARD_JSON_URL ?? "";

function formatNum(x: string | number | undefined) {
  if (x === undefined || x === null) return "-";
  const n = typeof x === "string" ? Number(x) : x;
  if (!Number.isFinite(n)) return String(x);
  return n.toLocaleString(undefined, { maximumFractionDigits: 9 });
}

export default function Page() {
  const [data, setData] = useState<Payload | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastFetchLocal, setLastFetchLocal] = useState<string | null>(null);

  const title = "💎Casper Community Contest 3, Diamond Hands💎";
  const subtitle = (
    <>
      Build by Dorito, using{" "}
      <span
        title="Enterprise-grade middleware APIs designed to supercharge developers and serve as the primary access point for Casper Network data"
        style={{ textDecoration: "underline dotted", cursor: "help" }}
      >
        CSPR.cloud
      </span>
      . Always verify on-chain, this is just for testing purposes.
    </>
  );

  const fetchLeaderboard = async () => {
    if (!JSON_URL) {
      setStatus("error");
      setError("Missing NEXT_PUBLIC_LEADERBOARD_JSON_URL");
      return;
    }
    try {
      setStatus("loading");
      setError(null);

      // no-store to avoid caching stale JSON
      const res = await fetch(JSON_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status} while fetching leaderboard JSON`);

      const json = (await res.json()) as Payload;
      setData(json);
      setStatus("ok");
      setLastFetchLocal(new Date().toLocaleString());
    } catch (e: any) {
      setStatus("error");
      setError(e?.message ?? String(e));
    }
  };

  // initial fetch
  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto refresh every REFRESH_SECONDS
  useEffect(() => {
    const ms = Math.max(10, REFRESH_SECONDS) * 1000;
    const id = setInterval(() => {
      fetchLeaderboard();
    }, ms);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [REFRESH_SECONDS, JSON_URL]);

  const rows = useMemo(() => data?.rows ?? [], [data]);

  return (
    <main style={styles.desktop}>
      <div style={styles.window}>
        <div style={styles.titlebar}>
          <span style={styles.titlebarText}>casper-leaderboard.exe</span>
          <div style={styles.titlebarButtons}>
            <span style={styles.btn}>_</span>
            <span style={styles.btn}>□</span>
            <span style={styles.btn}>×</span>
          </div>
        </div>

        <div style={styles.content}>
          <h1 style={styles.h1}>{title}</h1>
          <p style={styles.p}>{subtitle}</p>

          <div style={styles.metaRow}>
            <div>
              <span style={styles.badge}>Network: {data?.network ?? "?"}</span>{" "}
              <span style={styles.badge}>Auto-refresh: {REFRESH_SECONDS}s</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={styles.badge}>
                Data updated_at: {data?.updated_at ? new Date(data.updated_at).toLocaleString() : "?"}
              </span>{" "}
              <span style={styles.badge}>Last fetch: {lastFetchLocal ?? "—"}</span>
            </div>
          </div>

          <div style={styles.toolbar}>
            <button onClick={fetchLeaderboard} style={styles.primaryBtn}>
              Refresh now
            </button>
            <span style={styles.statusText}>
              Status: <b>{status}</b>
              {error ? <span style={styles.errorText}> — {error}</span> : null}
            </span>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Rank</th>
                  <th style={styles.th}>Public Key</th>
                  <th style={styles.thRight}>Total</th>
                  <th style={styles.thRight}>Liquid</th>
                  <th style={styles.thRight}>Staked</th>
                  <th style={styles.th}>Verify</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.public_key ?? i} style={i % 2 ? styles.trAlt : styles.tr}>
                    <td style={styles.td}>{r.rank ?? i + 1}</td>
                    <td style={styles.tdMono} title={r.public_key ?? ""}>
                      {r.public_key_short ?? (r.public_key ? `${r.public_key.slice(0, 6)}…${r.public_key.slice(-6)}` : "-")}
                    </td>
                    <td style={styles.tdRight}>{formatNum(r.total_cspr)}</td>
                    <td style={styles.tdRight}>{formatNum(r.liquid_cspr)}</td>
                    <td style={styles.tdRight}>{formatNum(r.staked_cspr)}</td>
                    <td style={styles.td}>
                      {r.cspr_live_url ? (
                        <a style={styles.link} href={r.cspr_live_url} target="_blank" rel="noreferrer">
                          cspr.live
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.footer}>
            Total balance includes: Liquid + Staked (+ rewards visible on-chain) — but always verify on cspr.live.
          </div>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  desktop: {
    minHeight: "100vh",
    padding: 24,
    background: "linear-gradient(180deg, #6b7bd1 0%, #3b4aa3 55%, #1d255f 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
  window: {
    width: "min(1100px, 96vw)",
    border: "3px solid #e8e8e8",
    boxShadow: "8px 8px 0 rgba(0,0,0,0.35)",
    background: "#c0c0c0",
  },
  titlebar: {
    background: "linear-gradient(90deg, #001f7a 0%, #0a3aa8 60%, #0b4bcc 100%)",
    color: "white",
    padding: "8px 10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "2px solid #000",
  },
  titlebarText: { fontWeight: 800, letterSpacing: 0.5 },
  titlebarButtons: { display: "flex", gap: 6 },
  btn: {
    display: "inline-block",
    width: 22,
    height: 18,
    background: "#c0c0c0",
    color: "#000",
    textAlign: "center",
    lineHeight: "18px",
    border: "2px solid #fff",
    boxShadow: "inset -2px -2px 0 #808080, inset 2px 2px 0 #e8e8e8",
    fontWeight: 900,
  },
  content: { padding: 16, color: "#000" },
  h1: { margin: "4px 0 8px", fontSize: 22 },
  p: { margin: "0 0 12px", fontSize: 13 },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  badge: {
    display: "inline-block",
    padding: "3px 8px",
    background: "#e8e8e8",
    border: "2px solid #fff",
    boxShadow: "inset -2px -2px 0 #808080, inset 2px 2px 0 #ffffff",
    fontSize: 12,
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  primaryBtn: {
    padding: "6px 10px",
    background: "#e8e8e8",
    border: "2px solid #fff",
    boxShadow: "inset -2px -2px 0 #808080, inset 2px 2px 0 #ffffff",
    cursor: "pointer",
    fontWeight: 800,
  },
  statusText: { fontSize: 12 },
  errorText: { color: "#a10000", fontWeight: 800 },
  tableWrap: {
    overflowX: "auto",
    background: "#dcdcdc",
    border: "2px solid #fff",
    boxShadow: "inset -2px -2px 0 #808080, inset 2px 2px 0 #ffffff",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 12,
  },
  th: {
    textAlign: "left",
    padding: "8px 8px",
    borderBottom: "2px solid #000",
    background: "#bdbdbd",
  },
  thRight: {
    textAlign: "right",
    padding: "8px 8px",
    borderBottom: "2px solid #000",
    background: "#bdbdbd",
  },
  tr: { background: "#dcdcdc" },
  trAlt: { background: "#d3d3d3" },
  td: { padding: "7px 8px", borderBottom: "1px solid #999" },
  tdRight: { padding: "7px 8px", borderBottom: "1px solid #999", textAlign: "right" },
  tdMono: { padding: "7px 8px", borderBottom: "1px solid #999" },
  link: { color: "#001f7a", fontWeight: 800, textDecoration: "underline" },
  footer: {
    marginTop: 12,
    padding: 10,
    background: "#e8e8e8",
    border: "2px solid #fff",
    boxShadow: "inset -2px -2px 0 #808080, inset 2px 2px 0 #ffffff",
    fontSize: 12,
  },
};
