"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  rank: number;
  public_key_short: string;

  // totals (strings in your JSON)
  total_cspr: string;
  liquid_cspr: string;
  staked_cspr: string;

  public_key: string;
  cspr_live_url?: string;

  total_motes?: string;
  liquid_motes?: string;
  staked_motes?: string;
};

type Payload = {
  network?: string;
  updated_at?: string;
  rows: Row[];
  errors?: { public_key: string; error: string }[];
};

function fmtCSPR(x: string) {
  const n = Number(x);
  if (!Number.isFinite(n)) return x;
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function safeUrl(pk: string) {
  // fallback if your JSON ever misses cspr_live_url
  return `https://testnet.cspr.live/account/${pk}`;
}

export default function Page() {
  const url = process.env.NEXT_PUBLIC_LEADERBOARD_JSON_URL;
  const networkLabel = process.env.NEXT_PUBLIC_NETWORK_LABEL ?? "testnet";

  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  async function load() {
    if (!url) {
      setErr("Missing NEXT_PUBLIC_LEADERBOARD_JSON_URL in .env.local / Vercel env vars.");
      return;
    }

    try {
      setErr(null);
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
      const payload = (await r.json()) as Payload;

      // Defensive: ensure rows exist
      if (!payload?.rows || !Array.isArray(payload.rows)) {
        throw new Error("JSON did not contain rows[]");
      }

      setData(payload);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  }

  // Refresh every minute (page auto-updates if your JSON changes)
  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    if (!data?.rows) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return data.rows;

    return data.rows.filter((r) => {
      const pk = r.public_key?.toLowerCase() ?? "";
      const short = r.public_key_short?.toLowerCase() ?? "";
      return pk.includes(needle) || short.includes(needle);
    });
  }, [data, q]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }

  const updatedAt = data?.updated_at ? new Date(data.updated_at) : null;

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Top banner */}
        <div className="retro-banner px-8 py-6">
          <div className="flex items-center justify-center gap-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500 shadow" />
            <h1 className="retro-title text-5xl font-serif">Leaderboard</h1>
          </div>
        </div>

        {/* Main UI frame */}
        <div className="mt-10 retro-frame p-6">
          <div className="retro-panel p-6">
            <div className="text-center text-xl font-black mb-2">
              💎Casper Community Contest 3, Diamond Hands💎
            </div>

            <div className="text-center text-sm font-semibold mb-6">
              Build by Dorito, using{" "}
              <span className="retro-tip-wrap">
                <span tabIndex={0} className="retro-link cursor-help">
                  CSPR.cloud
                </span>
                <span className="retro-tip-box">
                  Enterprise-grade middleware APIs designed to supercharge developers and serve
                  as the primary access point for Casper Network data
                </span>
              </span>
              . Always verify on-chain, this is just for testing purposes
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="text-sm font-semibold">
                {updatedAt ? (
                  <>
                    Updated:{" "}
                    <span className="retro-green">{updatedAt.toLocaleString()}</span>{" "}
                    <span className="retro-pill ml-2">{data?.network ?? networkLabel}</span>
                  </>
                ) : (
                  <>
                    Updated: <span className="retro-pill ml-2">loading…</span>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  className="retro-input w-full sm:w-96"
                  placeholder="Search public key…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <button onClick={load} className="retro-btn retro-btn-blue">
                  Refresh
                </button>
              </div>
            </div>

            {err ? (
              <div className="retro-panel p-4 mb-6">
                <div className="font-black">Error</div>
                <div className="text-sm">{err}</div>
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="retro-table">
                <thead>
                  <tr>
                    <th className="retro-th text-left">Rank</th>
                    <th className="retro-th text-left">Account</th>
                    <th className="retro-th text-right">Total (CSPR)</th>
                    <th className="retro-th text-right">Liquid</th>
                    <th className="retro-th text-right">Staked</th>
                    <th className="retro-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const link = r.cspr_live_url ?? safeUrl(r.public_key);

                    return (
                      <tr key={r.public_key}>
                        <td className="retro-td font-black">{r.rank}</td>

                        <td className="retro-td">
                          <a className="retro-link" href={link} target="_blank" rel="noreferrer">
                            {r.public_key_short}
                          </a>
                          <div className="text-xs break-all mt-1">{r.public_key}</div>
                        </td>

                        <td className="retro-td text-right font-black">
                          {fmtCSPR(r.total_cspr)}
                        </td>

                        <td className="retro-td text-right font-semibold">
                          {fmtCSPR(r.liquid_cspr)}
                        </td>

                        <td className="retro-td text-right font-semibold">
                          {fmtCSPR(r.staked_cspr)}
                        </td>

                        <td className="retro-td text-right">
                          <div className="flex justify-end gap-2">
                            <button className="retro-btn" onClick={() => copy(r.public_key)}>
                              Copy PK
                            </button>
                            <a
                              className="retro-btn retro-btn-blue"
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {data?.errors?.length ? (
              <div className="mt-6 retro-panel p-4">
                <div className="font-black mb-2">Fetch errors</div>
                <ul className="text-sm list-disc pl-6">
                  {data.errors.slice(0, 10).map((e) => (
                    <li key={e.public_key}>
                      <span className="font-semibold">{e.public_key}</span>: {e.error}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
