"use client";
// @ts-nocheck

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f5f7fc";

type QRow = {
  id: string;
  title?: string;
  question?: string;
  prompt?: string;
  status?: "open" | "awaiting_user" | "resolved" | string;
  discussion_open?: boolean;
  created_by?: string;
  user_id?: string;
  author_id?: string;
  created_at?: string;
};

type OptionRow = {
  id?: string;
  text?: string;
  label?: string;
  title?: string;
  image_url?: string;
  image?: string;
  picked_index?: number;
  idx?: number;
  order_index?: number;
};

type VoteRow = {
  id?: string;
  quandr3_id?: string;
  q_id?: string;
  option_id?: string;
  picked_index?: number;
  choice_index?: number;
  created_at?: string;
};

function safeStr(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

function pickQuestion(q: QRow) {
  return safeStr(q.title) || safeStr(q.question) || safeStr(q.prompt) || "Untitled Quandr3";
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Lightweight confetti (no dependencies).
 */
function fireConfetti() {
  const root = document.createElement("div");
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.pointerEvents = "none";
  root.style.zIndex = "9999";
  document.body.appendChild(root);

  const colors = [BLUE, TEAL, CORAL, NAVY, "#ffffff"];
  const count = 140;

  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    const size = 6 + Math.random() * 10;

    p.style.position = "absolute";
    p.style.left = `${Math.random() * 100}vw`;
    p.style.top = `-20px`;
    p.style.width = `${size}px`;
    p.style.height = `${size * 0.6}px`;
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.opacity = "0.95";
    p.style.borderRadius = "2px";
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    p.style.boxShadow = "0 6px 18px rgba(0,0,0,0.12)";

    const fall = 1400 + Math.random() * 1200;
    const drift = (Math.random() - 0.5) * 260;
    const rotate = (Math.random() - 0.5) * 720;

    p.animate(
      [
        { transform: `translate(0px, 0px) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${drift}px, 110vh) rotate(${rotate}deg)`, opacity: 0.05 },
      ],
      { duration: fall, easing: "cubic-bezier(.2,.8,.2,1)" }
    );

    root.appendChild(p);

    window.setTimeout(() => {
      try {
        p.remove();
      } catch {}
    }, fall + 50);
  }

  window.setTimeout(() => {
    try {
      root.remove();
    } catch {}
  }, 2800);
}

async function trySelectOne(table: string, match: Record<string, any>) {
  const keys = Object.keys(match);
  let q = supabase.from(table).select("*");
  keys.forEach((k) => (q = q.eq(k, match[k])));
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return data;
}

async function trySelectMany(table: string, match: Record<string, any>, orderBy?: { col: string; asc?: boolean }) {
  const keys = Object.keys(match);
  let q = supabase.from(table).select("*");
  keys.forEach((k) => (q = q.eq(k, match[k])));
  if (orderBy?.col) q = q.order(orderBy.col, { ascending: orderBy.asc ?? true });
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function tryUpdate(table: string, match: Record<string, any>, patch: Record<string, any>) {
  let q = supabase.from(table).update(patch);
  Object.keys(match).forEach((k) => (q = q.eq(k, match[k])));
  const { error } = await q;
  if (error) throw error;
}

async function tryInsert(table: string, row: Record<string, any>) {
  const { error } = await supabase.from(table).insert(row);
  if (error) throw error;
}

export default function ResolvePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = safeStr((params as any)?.id);

  // DEV-only preview (?dev=1)
  const devPreview = useMemo(() => {
    const flag = searchParams?.get("dev") === "1";
    return flag && process.env.NODE_ENV !== "production";
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [qrow, setQrow] = useState<QRow | null>(null);
  const [options, setOptions] = useState<OptionRow[]>([]);
  const [counts, setCounts] = useState<number[]>([]);

  const [isCurioso, setIsCurioso] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [note, setNote] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [discussionOpen, setDiscussionOpen] = useState<boolean>(false);
  const [togglingDiscussion, setTogglingDiscussion] = useState(false);

  const status = qrow?.status || "open";

  const totalVotes = useMemo(() => (counts || []).reduce((a, b) => a + (b || 0), 0), [counts]);

  useEffect(() => {
    let alive = true;

    async function boot() {
      try {
        setLoading(true);
        setErrorMsg("");

        // auth
        setAuthLoading(true);
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id || null;
        if (!alive) return;
        setUserId(uid);
        setAuthLoading(false);

        // ✅ FIX #1: if not logged in, send to login
        if (!uid && !devPreview) {
          router.replace(`/login?next=/q/${id}/resolve`);
          return;
        }

        // fetch quandr3 row
        let q: any = null;
        try {
          q = await trySelectOne("quandr3s", { id });
        } catch (e1) {
          q = await trySelectOne("quandrs", { id });
        }

        if (!alive) return;

        const qTyped: QRow = q || { id };
        setQrow(qTyped);
        setDiscussionOpen(!!qTyped.discussion_open);

        const owner = safeStr(qTyped.created_by) || safeStr(qTyped.user_id) || safeStr(qTyped.author_id);
        const isOwner = !!uid && !!owner && uid === owner;

        setIsCurioso(isOwner || devPreview);

        if (!isOwner && !devPreview) {
          router.replace(`/q/${id}`);
          return;
        }

        // options
        const opts = await trySelectMany("quandr3_options", { quandr3_id: id }, { col: "idx", asc: true });
        const normalized = (opts || []).map((o: any) => ({
          id: o.id,
          text: o.text ?? o.label ?? o.title ?? "",
          image_url: o.image_url ?? o.image ?? "",
          idx: typeof o.idx === "number" ? o.idx : typeof o.order_index === "number" ? o.order_index : undefined,
        }));
        normalized.sort((a, b) => (a.idx ?? 999) - (b.idx ?? 999));
        setOptions(normalized);
        setSelectedIndex(0);

        // votes
        const votes = await trySelectMany("quandr3_votes", { quandr3_id: id }, { col: "created_at", asc: true });
        const c = new Array(Math.max(1, normalized.length)).fill(0);

        for (const v of votes as VoteRow[]) {
          // ✅ FIX #2: support choice_index OR picked_index
          const pi =
            typeof (v as any).choice_index === "number"
              ? (v as any).choice_index
              : typeof (v as any).picked_index === "number"
              ? (v as any).picked_index
              : null;

          if (pi !== null && pi >= 0) {
            while (c.length <= pi) c.push(0);
            c[pi] += 1;
          }
        }

        setCounts(c);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(safeStr(err?.message) || "Something went wrong loading the resolve page.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (id) boot();
    return () => {
      alive = false;
    };
  }, [id, router, devPreview]);

  // ...rest of your render code unchanged...
}
