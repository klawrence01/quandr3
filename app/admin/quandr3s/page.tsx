// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabase/browser";
import Link from "next/link";

type Quandr3Row = {
  id: string;
  title: string;
  category: string;
  status: string;
  city?: string | null;
  created_at: string;
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
};

const NAVY = "#0b2343";
const BLUE = "#1e63f3";

type StatusFilter = "all" | "Open" | "Resolved";
type IntegrityFilter = "all" | "valid" | "broken";

const ADMIN_CATEGORIES = [
  "Money",
  "Relationships",
  "Career",
  "Style",
  "Lifestyle",
  "Real Estate",
];

const DEFAULT_OPTION_D = "None of these / I’ll explain";

export default function AdminQuandr3ListPage() {
  const [items, setItems] = useState<Quandr3Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [integrityFilter, setIntegrityFilter] =
    useState<IntegrityFilter>("all");

  // create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Money");
  const [newStatus, setNewStatus] = useState<"Open" | "Resolved">("Open");
  const [newCity, setNewCity] = useState("New Haven, CT");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");

  async function load() {
    setLoading(true);
    setMessage(null);

    let query = supabase
      .from("quandr3s")
      .select(
        `
        id,
        title,
        category,
        status,
        city,
        created_at,
        option_a,
        option_b,
        option_c,
        option_d
      `
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (search.trim()) {
      const needle = `%${search.trim()}%`;
      query = query.or(
        `title.ilike.${needle},category.ilike.${needle},city.ilike.${needle}`
      );
    }

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.log("[AdminQuandr3s] Supabase load error:", error);
      setMessage(error.message);
      setItems([]);
    } else {
      setItems((data || []) as Quandr3Row[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [search, statusFilter]);

  // helper: "Broken" now means fewer than 3 core options (A/B/C) filled
  function isBroken(q: Quandr3Row) {
    const coreOpts = [q.option_a, q.option_b, q.option_c].filter(
      (x) => x && x.trim().length > 0
    );
    return coreOpts.length < 3;
  }

  const filteredItems = useMemo(() => {
    if (integrityFilter === "all") return items;
    if (integrityFilter === "broken") {
      return items.filter((q) => isBroken(q));
    }
    return items.filter((q) => !isBroken(q));
  }, [items, integrityFilter]);

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Delete this Quandr3 permanently? This cannot be undone."
    );
    if (!confirmed) return;

    const { error } = await supabase.from("quandr3s").delete().eq("id", id);

    if (error) {
      console.log("[AdminQuandr3s] Supabase delete error:", error);
      alert("Delete failed: " + error.message);
      return;
    }

    setItems((prev) => prev.filter((q) => q.id !== id));
  }

  function resetCreateForm() {
    setNewTitle("");
    setNewCategory("Money");
    setNewStatus("Open");
    setNewCity("New Haven, CT");
    setOptA("");
    setOptB("");
    setOptC("");
    setOptD("");
    setCreateError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    const a = optA.trim();
    const b = optB.trim();
    const c = optC.trim();
    const d = optD.trim();

    // must have at least A, B, C filled
    if (!a || !b || !c) {
      setCreateError("Please fill in at least options A, B, and C.");
      return;
    }

    const finalD = d || DEFAULT_OPTION_D;

    if (!newTitle.trim()) {
      setCreateError("Title is required.");
      return;
    }

    setCreating(true);

    const { data, error } = await supabase
      .from("quandr3s")
      .insert([
        {
          title: newTitle.trim(),
          category: newCategory,
          status: newStatus,
          city: newCity.trim() || null,
          option_a: a,
          option_b: b,
          option_c: c,
          option_d: finalD,
        },
      ])
      .select("id")
      .single();

    setCreating(false);

    if (error) {
      console.log("[AdminQuandr3s] Supabase create error:", error);
      setCreateError(error.message);
      return;
    }

    await load();
    resetCreateForm();
    setShowCreate(false);

    if (data?.id) {
      const goView = window.confirm(
        "Quandr3 created. Do you want to open the debug vote page now?"
      );
      if (goView) {
        window.location.href = `/debug/vote/${data.id}`;
      }
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "64px 24px 40px",
        fontFamily: "system-ui",
        background: "#f5f7fc",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto", position: "relative" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 30,
                fontWeight: 900,
                marginBottom: 4,
                color: NAVY,
              }}
            >
              Quandr3 Admin · All Quandr3s
            </h1>
            <p style={{ fontSize: 13, color: "#444", margin: 0 }}>
              Search, review, clean up broken test Quandr3s, or create new ones
              for testing.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetCreateForm();
              setShowCreate(true);
            }}
            style={{
              borderRadius: 999,
              border: "none",
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              background: BLUE,
              color: "#fff",
              boxShadow: "0 14px 32px rgba(15,23,42,0.4)",
              whiteSpace: "nowrap",
            }}
          >
            + New Quandr3
          </button>
        </div>

        {/* Filters row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            margin: "16px 0",
          }}
        >
          {/* Search box */}
          <div
            style={{
              flex: 1,
              minWidth: 220,
              borderRadius: 999,
              background: "#ffffff",
              boxShadow: "0 10px 25px rgba(15,23,42,0.12)",
              padding: "8px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, category, or city…"
              style={{
                border: "none",
                outline: "none",
                flex: 1,
                fontSize: 13,
                background: "transparent",
              }}
            />
          </div>

          {/* Status filter */}
          <div
            style={{
              display: "inline-flex",
              borderRadius: 999,
              background: "#ffffff",
              padding: 4,
              boxShadow: "0 10px 25px rgba(15,23,42,0.12)",
            }}
          >
            {(["all", "Open", "Resolved"] as StatusFilter[]).map((val) => {
              const active = statusFilter === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setStatusFilter(val)}
                  style={{
                    borderRadius: 999,
                    border: "none",
                    padding: "6px 12px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    background: active ? BLUE : "transparent",
                    color: active ? "#fff" : NAVY,
                  }}
                >
                  {val === "all" ? "All statuses" : val}
                </button>
              );
            })}
          </div>

          {/* Integrity filter */}
          <div
            style={{
              display: "inline-flex",
              borderRadius: 999,
              background: "#ffffff",
              padding: 4,
              boxShadow: "0 10px 25px rgba(15,23,42,0.12)",
            }}
          >
            {(["all", "valid", "broken"] as IntegrityFilter[]).map((val) => {
              const active = integrityFilter === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setIntegrityFilter(val)}
                  style={{
                    borderRadius: 999,
                    border: "none",
                    padding: "6px 12px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    background: active ? BLUE : "transparent",
                    color: active ? "#fff" : NAVY,
                  }}
                >
                  {val === "all"
                    ? "All"
                    : val === "valid"
                    ? "Valid (3+ options)"
                    : "Broken (<3 options)"}
                </button>
              );
            })}
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={load}
            style={{
              borderRadius: 999,
              border: "none",
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              background: "#ffffff",
              color: NAVY,
              boxShadow: "0 10px 25px rgba(15,23,42,0.12)",
            }}
          >
            Refresh
          </button>
        </div>

        {message && (
          <p style={{ fontSize: 13, color: "#c0392b", marginBottom: 10 }}>
            {message}
          </p>
        )}

        {loading && (
          <p style={{ fontSize: 13, color: "#444" }}>Loading Quandr3s…</p>
        )}

        {/* Table */}
        <div
          style={{
            borderRadius: 18,
            overflow: "hidden",
            background: "#ffffff",
            boxShadow: "0 18px 50px rgba(15,23,42,0.18)",
            border: "1px solid rgba(15,23,42,0.06)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead
              style={{
                background: "#f1f4ff",
                textAlign: "left",
              }}
            >
              <tr>
                <th style={{ padding: "10px 14px" }}>Title</th>
                <th style={{ padding: "10px 14px" }}>Category</th>
                <th style={{ padding: "10px 14px" }}>Status</th>
                <th style={{ padding: "10px 14px" }}>City</th>
                <th style={{ padding: "10px 14px" }}>Created</th>
                <th style={{ padding: "10px 14px" }}>Integrity</th>
                <th style={{ padding: "10px 14px", textAlign: "right" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={7}
                    style={{ padding: "12px 14px", color: "#666" }}
                  >
                    No Quandr3s match these filters yet.
                  </td>
                </tr>
              )}

              {filteredItems.map((q) => {
                const broken = isBroken(q);
                return (
                  <tr
                    key={q.id}
                    style={{
                      borderTop: "1px solid rgba(15,23,42,0.06)",
                    }}
                  >
                    <td style={{ padding: "10px 14px", maxWidth: 260 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          marginBottom: 2,
                          color: NAVY,
                        }}
                      >
                        {q.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#777",
                        }}
                      >
                        ID: {q.id.slice(0, 8)}…
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>{q.category}</td>
                    <td style={{ padding: "10px 14px" }}>{q.status}</td>
                    <td style={{ padding: "10px 14px" }}>{q.city || "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      {new Date(q.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 999,
                          background: broken
                            ? "rgba(192,57,43,0.1)"
                            : "rgba(46,204,113,0.1)",
                          color: broken ? "#c0392b" : "#2ecc71",
                        }}
                      >
                        {broken ? "Broken" : "Valid"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Link
                        href={`/debug/vote/${q.id}`}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          marginRight: 8,
                          color: BLUE,
                        }}
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(q.id)}
                        style={{
                          borderRadius: 999,
                          border: "none",
                          padding: "4px 10px",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          background: "rgba(192,57,43,0.08)",
                          color: "#c0392b",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* CREATE MODAL */}
        {showCreate && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 40,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 620,
                borderRadius: 20,
                background: "#ffffff",
                padding: 20,
                boxShadow: "0 30px 80px rgba(15,23,42,0.6)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    margin: 0,
                    color: NAVY,
                  }}
                >
                  New Quandr3 (Admin)
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  style={{
                    border: "none",
                    background: "none",
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "#555",
                  marginBottom: 16,
                }}
              >
                Create a live Quandr3 with at least three options. If you leave
                D blank, we’ll auto-fill it as “{DEFAULT_OPTION_D}”.
              </p>

              <form onSubmit={handleCreate}>
                {/* Title */}
                <div style={{ marginBottom: 10 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: I got two job offers, which one should I take?"
                    style={{
                      width: "100%",
                      borderRadius: 10,
                      border: "1px solid #d0d7ff",
                      padding: "8px 10px",
                      fontSize: 13,
                    }}
                  />
                </div>

                {/* Category + Status + City */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        marginBottom: 4,
                      }}
                    >
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      style={{
                        width: "100%",
                        borderRadius: 10,
                        border: "1px solid #d0d7ff",
                        padding: "8px 10px",
                        fontSize: 13,
                      }}
                    >
                      {ADMIN_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        marginBottom: 4,
                      }}
                    >
                      Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) =>
                        setNewStatus(e.target.value as "Open" | "Resolved")
                      }
                      style={{
                        width: "100%",
                        borderRadius: 10,
                        border: "1px solid #d0d7ff",
                        padding: "8px 10px",
                        fontSize: 13,
                      }}
                    >
                      <option value="Open">Open</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        marginBottom: 4,
                      }}
                    >
                      City (optional)
                    </label>
                    <input
                      type="text"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      style={{
                        width: "100%",
                        borderRadius: 10,
                        border: "1px solid #d0d7ff",
                        padding: "8px 10px",
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>

                {/* Options */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <OptionField
                    label="Option A"
                    value={optA}
                    onChange={setOptA}
                    placeholder="Ex: Take the higher-paying job in NYC"
                  />
                  <OptionField
                    label="Option B"
                    value={optB}
                    onChange={setOptB}
                    placeholder="Ex: Take the remote job with lower pay"
                  />
                  <OptionField
                    label="Option C"
                    value={optC}
                    onChange={setOptC}
                    placeholder="Ex: Stay at my current job for now"
                  />
                  <OptionField
                    label="Option D (optional)"
                    value={optD}
                    onChange={setOptD}
                    placeholder={`Leave blank to use: "${DEFAULT_OPTION_D}"`}
                  />
                </div>

                {createError && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "#c0392b",
                      marginBottom: 8,
                    }}
                  >
                    {createError}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    marginTop: 6,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    style={{
                      borderRadius: 999,
                      border: "none",
                      padding: "8px 14px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      background: "#f1f4ff",
                      color: NAVY,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    style={{
                      borderRadius: 999,
                      border: "none",
                      padding: "8px 16px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      background: BLUE,
                      color: "#fff",
                      boxShadow: "0 12px 30px rgba(15,23,42,0.45)",
                      opacity: creating ? 0.7 : 1,
                    }}
                  >
                    {creating ? "Creating…" : "Create Quandr3"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function OptionField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          borderRadius: 10,
          border: "1px solid #d0d7ff",
          padding: "8px 10px",
          fontSize: 13,
        }}
      />
    </div>
  );
}
