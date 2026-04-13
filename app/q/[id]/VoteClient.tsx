"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

type VoteClientProps = {
  serverUserId?: string;
};

function safeStr(x: any) {
  return (x ?? "").toString();
}

function fmt(ts?: string) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts || "";
  }
}

function cleanLabel(x?: any) {
  const s = safeStr(x).trim().toUpperCase();
  return ["A", "B", "C", "D"].includes(s) ? s : "";
}

function optionText(o: any) {
  return safeStr(o?.text || o?.value).trim();
}

export default function VoteClient({ serverUserId = "" }: VoteClientProps) {
  const params = useParams();
  const id = safeStr((params as any)?.id);

  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [meId, setMeId] = useState(serverUserId || "");
  const [selected, setSelected] = useState<string>("");
  const [reason, setReason] = useState("");
  const [myVote, setMyVote] = useState<string>("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isOwner = useMemo(() => {
    const viewer = safeStr(meId).trim().toLowerCase();
    const owner = safeStr(q?.author_id || q?.user_id).trim().toLowerCase();
    return !!viewer && !!owner && viewer === owner;
  }, [meId, q?.author_id, q?.user_id]);

  useEffect(() => {
    async function init() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user?.id) {
          setMeId(String(user.id));
        } else if (serverUserId) {
          setMeId(serverUserId);
        }
      } catch {
        if (serverUserId) setMeId(serverUserId);
      }
    }

    init();
  }, [serverUserId]);

  useEffect(() => {
    if (!id) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, meId]);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const { data: qData, error: qErr } = await supabase
        .from("quandr3s")
        .select("*")
        .eq("id", id)
        .single();

      if (qErr) throw qErr;

      const { data: oData, error: oErr } = await supabase
        .from("quandr3_options")
        .select("*")
        .eq("quandr3_id", id)
        .order("order", { ascending: true });

      if (oErr) throw oErr;

      setQ(qData || null);
      setOptions((oData || []).filter((o: any) => cleanLabel(o?.label)));

      if (meId) {
        const { data: voteRow } = await supabase
          .from("quandr3_choices")
          .select("label,text")
          .eq("quandr3_id", id)
          .eq("voter_id", meId)
          .maybeSingle();

        if (voteRow) {
          setMyVote(cleanLabel(voteRow.label));
          setReason(safeStr(voteRow.text));
        } else {
          setMyVote("");
        }
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load Quandr3.");
      setQ(null);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }

  async function submitVote() {
    setError("");

    if (!meId) {
      setError("You must be signed in to vote.");
      return;
    }

    if (!q) {
      setError("This Quandr3 could not be loaded.");
      return;
    }

    if (isOwner) {
      setError("You cannot vote on your own Quandr3.");
      return;
    }

    if (safeStr(q.status).toLowerCase() !== "open") {
      setError("Voting is closed for this Quandr3.");
      return;
    }

    if (!selected) {
      setError("Pick an option first.");
      return;
    }

    setSaving(true);

    try {
      const existingLabel = cleanLabel(myVote);

      if (existingLabel) {
        const { error: updateErr } = await supabase
          .from("quandr3_choices")
          .update({
            label: selected,
            text: reason.trim(),
          })
          .eq("quandr3_id", id)
          .eq("voter_id", meId);

        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase.from("quandr3_choices").insert({
          quandr3_id: id,
          voter_id: meId,
          label: selected,
          text: reason.trim(),
        });

        if (insertErr) throw insertErr;
      }

      try {
        localStorage.setItem("quandr3_explore_refresh", String(Date.now()));
      } catch {}

      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to submit vote.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (error && !q) return <div className="p-6 text-red-600">{error}</div>;
  if (!q) return <div className="p-6">Not found</div>;

  const status = safeStr(q.status).toLowerCase();

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/explore" className="text-sm underline">
          ← Back to Explore
        </Link>

        <div className="flex gap-3 flex-wrap">
          <Link href={`/q/${id}/results`} className="text-sm underline">
            View Results
          </Link>

          {isOwner && status === "awaiting_user" && (
            <Link href={`/q/${id}/resolve`} className="text-sm underline">
              Resolve Quandr3
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs uppercase tracking-widest text-gray-500">
          {safeStr(q.category) || "Quandr3"}
        </div>

        <h1 className="text-3xl font-bold">{q.title}</h1>

        {(q.prompt || q.context) && (
          <p className="text-gray-700 whitespace-pre-line">{q.prompt || q.context}</p>
        )}

        <div className="text-sm text-gray-500">
          Posted: {fmt(q.created_at)}
          {q.closes_at ? <> • Closes: {fmt(q.closes_at)}</> : null}
        </div>
      </div>

      {status === "open" && (
        <div className="rounded-lg border bg-green-50 p-4">
          {isOwner ? (
            <div className="font-medium text-green-800">
              Your Quandr3 is gathering input.
            </div>
          ) : (
            <div className="font-medium text-green-800">
              Help someone decide.
            </div>
          )}
        </div>
      )}

      {status === "awaiting_user" && (
        <div className="rounded-lg border bg-yellow-50 p-4 space-y-3">
          {isOwner ? (
            <>
              <div className="font-medium text-yellow-800">
                Your Quandr3 is waiting on you. Review the results, then post your final resolution.
              </div>
              <div className="flex gap-3 flex-wrap">
                <Link href={`/q/${id}/results`} className="text-sm underline">
                  View Results
                </Link>
                <Link href={`/q/${id}/resolve`} className="text-sm underline">
                  Post Final Resolution
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="font-medium text-yellow-800">
                Voting is closed. Waiting for the Curioso’s final decision.
              </div>
              <Link href={`/q/${id}/results`} className="text-sm underline">
                View Results
              </Link>
            </>
          )}
        </div>
      )}

      {status === "resolved" && (
        <div className="rounded-lg border bg-blue-50 p-4">
          <div className="font-medium text-blue-800">Resolution posted.</div>

          {q.resolved_choice_label ? (
            <div className="mt-2">
              Final choice: <strong>{q.resolved_choice_label}</strong>
            </div>
          ) : null}

          {q.resolution_note ? (
            <p className="mt-2 text-gray-700 whitespace-pre-line">{q.resolution_note}</p>
          ) : null}

          <div className="mt-3">
            <Link href={`/q/${id}/results`} className="text-sm underline">
              View Full Results
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {options.map((o: any) => {
          const label = cleanLabel(o.label);
          const value = optionText(o);

          return (
            <button
              key={o.id || label}
              type="button"
              onClick={() => setSelected(label)}
              disabled={status !== "open" || isOwner}
              className={`w-full text-left p-4 border rounded-lg ${
                selected === label ? "border-black bg-gray-100" : "border-gray-300"
              } ${status !== "open" || isOwner ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              <div className="font-semibold">{label}</div>
              <div>{value}</div>
            </button>
          );
        })}
      </div>

      {!isOwner && status === "open" && (
        <div className="space-y-3">
          <textarea
            placeholder="Why did you choose this?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border rounded-lg p-3"
            rows={4}
          />

          <button
            onClick={submitVote}
            disabled={saving || !selected}
            className="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-60"
          >
            {saving ? "Submitting..." : myVote ? "Update Vote" : "Submit Vote"}
          </button>
        </div>
      )}

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
    </div>
  );
}