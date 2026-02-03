"use client";
// @ts-nocheck

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabase/browser";
import ExploreInner from "./_ExploreInner";

type Status = "all" | "open" | "awaiting_user" | "resolved";
type Sort = "new" | "closing";
type Scope = "global" | "local";

export default function ExploreClient() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState<string>("");

  // controls
  const [scope, setScope] = useState<Scope>("global");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [sort, setSort] = useState<Sort>("new");

  // local filters (only used when scope === "local")
  const [localCity, setLocalCity] = useState("");
  const [localState, setLocalState] = useState("");

  // categories pills
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    let alive = true;

    async function loadCategories() {
      // Best-effort: categories schema may vary. Try name+slug first, then slug only.
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, slug, name")
          .order("id", { ascending: true });

        if (!alive) return;

        if (!error) {
          const list = (data || []).map((c: any) => ({
            id: c.id,
            slug: c.slug || "",
            label: (c.name || c.slug || "").toString(),
          }));
          setCategories(list);
          return;
        }
      } catch {}

      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, slug")
          .order("id", { ascending: true });

        if (!alive) return;

        if (!error) {
          const list = (data || []).map((c: any) => ({
            id: c.id,
            slug: c.slug || "",
            label: (c.slug || "").toString(),
          }));
          setCategories(list);
          return;
        }
      } catch {}

      // If categories can’t load, we still render the page.
      setCategories([]);
    }

    async function loadQuandr3s() {
      setLoading(true);
      setErr("");

      // IMPORTANT: we never select "question" from the DB.
      // "question" is a UI field mapped from title.
      const { data, error } = await supabase
        .from("quandr3s")
        .select(
          `
          id,
          author_id,
          category,
          title,
          context,
          media_url,
          media_type,
          status,
          created_at,
          closes_at,
          voting_duration_hours,
          discussion_open,
          hero_image_url,
          city,
          state,
          region,
          country,
          visibility,
          sponsored_start,
          sponsored_end,
          sponsored_bid,
          sponsored_owner_id
        `
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (!alive) return;

      if (error) {
        setErr(error.message || "Couldn’t load Explore.");
        setRows([]);
        setLoading(false);
        return;
      }

      const base = (data || []).map((r: any) => ({
        ...r,
        // ✅ Canonical mapping: UI expects "question"
        question: r.title,
      }));

      // Attach Curioso profile info (best-effort)
      // Profiles schema may vary; try common fields.
      const authorIds = Array.from(
        new Set(base.map((r: any) => r.author_id).filter(Boolean))
      );

      if (!authorIds.length) {
        setRows(base);
        setLoading(false);
        return;
      }

      // Try rich profile columns first, then fallback.
      let profiles: any[] = [];
      try {
        const { data: p1, error: e1 } = await supabase
          .from("profiles")
          .select("id, username, handle, display_name, avatar_url")
          .in("id", authorIds);

        if (!e1) profiles = p1 || [];
      } catch {}

      if (!profiles.length) {
        try {
          const { data: p2, error: e2 } = await supabase
            .from("profiles")
            .select("id, username")
            .in("id", authorIds);

          if (!e2) profiles = p2 || [];
        } catch {}
      }

      const pMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => {
        pMap[p.id] = p;
      });

      const merged = base.map((r: any) => {
        const p = pMap[r.author_id] || null;
        const curiosoName =
          (p?.username || p?.handle || p?.display_name || "").toString().trim() ||
          "Curioso";
        const curiosoAvatar = (p?.avatar_url || "").toString().trim() || "";
        return {
          ...r,
          curiosoName,
          curiosoAvatar,
        };
      });

      setRows(merged);
      setLoading(false);
    }

    loadCategories();
    loadQuandr3s();

    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = [...rows];

    // category pill filter
    if (activeCategory !== "all") {
      const catNeedle = activeCategory.toLowerCase();
      list = list.filter((r) => (r.category || "").toLowerCase() === catNeedle);
    }

    // status filter
    if (status !== "all") list = list.filter((r) => r.status === status);

    // scope filter
    if (scope === "local") {
      const cNeedle = localCity.trim().toLowerCase();
      const sNeedle = localState.trim().toLowerCase();
      if (cNeedle) list = list.filter((r) => (r.city || "").toLowerCase().includes(cNeedle));
      if (sNeedle) list = list.filter((r) => (r.state || "").toLowerCase().includes(sNeedle));
    }

    // search
    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter((r) => {
        const title = (r.title || "").toLowerCase();
        const question = (r.question || "").toLowerCase(); // = title
        const context = (r.context || "").toLowerCase();
        const city = (r.city || "").toLowerCase();
        const state = (r.state || "").toLowerCase();
        const id = String(r.id || "");
        const category = (r.category || "").toLowerCase();
        const curioso = (r.curiosoName || "").toLowerCase();

        return (
          title.includes(needle) ||
          question.includes(needle) ||
          context.includes(needle) ||
          city.includes(needle) ||
          state.includes(needle) ||
          category.includes(needle) ||
          curioso.includes(needle) ||
          id.includes(needle)
        );
      });
    }

    // sort
    if (sort === "closing") {
      list.sort((a, b) => new Date(a.closes_at).getTime() - new Date(b.closes_at).getTime());
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  }, [rows, q, status, sort, scope, localCity, localState, categories, activeCategory]);

  return (
    <ExploreInner
      loading={loading}
      err={err}
      rows={filtered}
      q={q}
      setQ={setQ}
      status={status}
      setStatus={setStatus}
      sort={sort}
      setSort={setSort}
      scope={scope}
      setScope={setScope}
      localCity={localCity}
      setLocalCity={setLocalCity}
      localState={localState}
      setLocalState={setLocalState}
      categories={categories}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
    />
  );
}
