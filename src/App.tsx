import { useEffect, useMemo, useState } from "react";
import { getReleaseMini, type ReleaseMini } from "./lib/discogs";
import { useLocalStorageArray } from "./lib/useLocalStorageArray";

export default function App() {
  const [ids, setIds] = useLocalStorageArray("discogsReleaseIds", []);
  const [rows, setRows] = useState<ReleaseMini[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [input, setInput] = useState("");
  type SortKey = "lowest" | "forSale" | "artist" | "id";

  const [sortKey, setSortKey] = useState<SortKey>("lowest");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [onlyInStock, setOnlyInStock] = useState(false);

  function priceValue(lp: ReleaseMini["lowest_price"]): number | null {
    if (lp == null) return null;
    return typeof lp === "number" ? lp : lp.value ?? null;
  }

  function addId() {
    const id = parseReleaseId(input);
    if (!id) {
      alert(
        "Please enter a valid Release ID or a URL like https://www.discogs.com/release/12345/..."
      );
      return;
    }
    if (!ids.includes(id)) setIds([...ids, id]);
    setInput("");
  }

  function removeId(id: number) {
    setIds(ids.filter((x) => x !== id));
  }

  async function refresh() {
    if (ids.length === 0) {
      setRows([]);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await Promise.all(ids.map((id) => getReleaseMini(id)));
      setRows(data);
    } catch (e: any) {
      setErrorMsg(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  const displayRows = useMemo(() => {
    const filtered = onlyInStock
      ? rows.filter((r) => (r.num_for_sale ?? 0) > 0)
      : rows.slice();

    const cmp = (a: ReleaseMini, b: ReleaseMini) => {
      let va: number | string | null;
      let vb: number | string | null;

      if (sortKey === "lowest") {
        va = priceValue(a.lowest_price);
        vb = priceValue(b.lowest_price);

        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        return va - vb;
      }

      if (sortKey === "forSale") {
        va = a.num_for_sale ?? 0;
        vb = b.num_for_sale ?? 0;
        return (va as number) - (vb as number);
      }

      if (sortKey === "artist") {
        va = (a.artists || "").toLowerCase();
        vb = (b.artists || "").toLowerCase();
        return va < vb ? -1 : va > vb ? 1 : 0;
      }

      return a.id - b.id;
    };

    const sorted = filtered.sort(cmp);
    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [rows, onlyInStock, sortKey, sortDir]);

  useEffect(() => {
    refresh();
  }, [JSON.stringify(ids)]);

  const lastUpdated = useMemo(() => new Date().toLocaleTimeString(), [rows]);

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ width: "min(100%, 900px)" }}>
        <h1 style={{ textAlign: "center" }}>Discogs Watcher</h1>

        <section style={{ margin: "12px 0", display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Release ID or Release URL"
            style={{ flex: 1, padding: 8 }}
          />
          <button onClick={addId} style={{ padding: "8px 12px" }}>
            Add
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            style={{ padding: "8px 12px" }}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </section>

        <section
          style={{
            margin: "8px 0 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "nowrap",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
            }}
          >
            Sort by
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "inherit",
              }}
            >
              <option value="lowest">Lowest price</option>
              <option value="forSale">For sale</option>
              <option value="artist">Artist</option>
              <option value="id">ID</option>
            </select>
          </label>

          <button
            onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              whiteSpace: "nowrap",
            }}
          >
            {sortDir === "asc" ? "Asc ↑" : "Desc ↓"}
          </button>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginLeft: "auto",
              whiteSpace: "nowrap",
            }}
          >
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
            />
            <span>Only in stock</span>
          </label>
        </section>

        {ids.length > 0 && (
          <p style={{ color: "#555", marginBottom: 12 }}>
            Tracked IDs: {ids.join(", ")}{" "}
            {rows.length > 0 && <span>• last updated: {lastUpdated}</span>}
          </p>
        )}

        {errorMsg && (
          <div
            style={{
              background: "#fee",
              color: "#900",
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            <strong>Error:</strong> {errorMsg}
          </div>
        )}

        <Table rows={displayRows} onRemove={removeId} />
      </div>
    </main>
  );
}

function Table({
  rows,
  onRemove,
}: {
  rows: ReleaseMini[];
  onRemove: (id: number) => void;
}) {
  if (rows.length === 0) {
    return (
      <p style={{ color: "#666" }}>
        No items yet. Add a Release ID or URL above.
      </p>
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <Th>Cover</Th>
            <Th>ID</Th>
            <Th>Artist – Title</Th>
            <Th>For Sale</Th>
            <Th>Lowest Price</Th>
            <Th>Link</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
              <Td>
                {r.thumbUrl ? (
                  <img
                    src={r.thumbUrl}
                    alt={r.title}
                    loading="lazy"
                    style={{
                      width: 56,
                      height: 56,
                      objectFit: "cover",
                      borderRadius: 8,
                      background: "var(--surface)",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 8,
                      background: "var(--surface)",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 20,
                      color: "var(--muted)",
                    }}
                    title="No image"
                  >
                    💿
                  </div>
                )}
              </Td>
              <Td>{r.id}</Td>
              <Td>{r.artists ? `${r.artists} — ${r.title}` : r.title}</Td>
              <Td>{r.num_for_sale ?? "—"}</Td>
              <Td>{fmtPrice(r.lowest_price)}</Td>
              <Td>
                {r.uri ? (
                  <a href={`${r.uri}`} target="_blank" rel="noreferrer">
                    Discogs
                  </a>
                ) : (
                  <a href={r.resource_url} target="_blank" rel="noreferrer">
                    API
                  </a>
                )}
              </Td>
              <Td>
                <button
                  onClick={() => onRemove(r.id)}
                  style={{ padding: "6px 10px", borderRadius: 8 }}
                >
                  Remove
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: "left", padding: "8px 6px" }}>{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "8px 6px", textAlign: "left" }}>{children}</td>;
}

function parseReleaseId(input: string): number | null {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const m = trimmed.match(/\/release[s]?\/(\d+)/i);
  if (m) return Number(m[1]);
  return null;
}

function fmtPrice(lp: ReleaseMini["lowest_price"]) {
  if (lp == null) return "—";
  if (typeof lp === "number") return `${lp} $`;
  return `${lp.value} ${lp.currency === "USD" ? "$" : lp.currency}`;
}
