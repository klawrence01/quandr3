// app/q/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";

type Quandr3Row = {
  id: string;
  title: string;
  context: string | null;
  category: string;
  status: string;
  created_at: string;

  // ✅ resolved flow fields (small safe add)
  resolved_option_id?: string | null;
  resolution_note?: string | null;
  resolved_at?: string | null;
};

type OptionRow = {
  id: string;
  label: string; // "A" | "B" | "C" | "D"
  text: string;
};

type VoteRow = {
  id: string;
  option_id: string;
};

const NAVY = "#0b2343";

export default function Quandr3DetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [quandr3, setQuandr3] = useState<Quandr3Row | null>(null);
  const [options, setOptions] = useState<OptionRow[]>([]);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [userVotedOptionId, setUserVotedOptionId] = useState<string | null>(
    null
  );

  // ✅ resolved option row (small safe add)
  const [resolvedOption, setResolvedOption] = useState<OptionRow | null>(null);

  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived stats
  const totalVotes = votes.length;
  const voteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of votes) {
      counts[v.option_id] = (counts[v.option_id] || 0) + 1;
    }
    return counts;
  }, [votes]);

  const showResults =
    !!userVotedOptionId || (quandr3 && quandr3.status !== "open");

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      // reset resolvedOption on id change (safe)
      setResolvedOption(null);

      // 1) Load the Quandr3 itself
      const { data: qData, error: qError } = await supabase
        .from("quandr3s")
        .select(
          "id, title, context, category, status, created_at, resolved_option_id, resolution_note, resolved_at"
        )
        .eq("id", id)
        .single();

      if (!mounted) return;

      if (qError || !qData) {
        console.error("Quandr3 load error:", qError);
        setError("We couldn’t find that Quandr3.");
        setLoading(false);
        return;
      }

      const qRow = qData as Quandr3Row;
      setQuandr3(qRow);

      // ✅ If resolved, fetch the resolved option row (small safe add)
      if (qRow?.resolved_option_id) {
        const { data: ro, error: roErr } = await supabase
          .from("options")
          .select("id, label, text")
          .eq("id", qRow.resolved_option_id)
          .single();

        if (mounted && !roErr && ro) {
          setResolvedOption(ro as OptionRow);
        } else if (mounted && roErr) {
          console.warn("Resolved option load error:", roErr);
          // don't fail page
          setResolvedOption(null);
        }
      }

      // 2) Load options
      const { data: optData, error: optError } = await supabase
        .from("options")
        .select("id, label, text")
        .eq("quandr3_id", id)
        .order("label", { ascending: true });

      if (!mounted) return;

      if (optError) {
        console.error("Options load error:", optError);
        setError("We couldn’t load the options for this Quandr3.");
        setLoading(false);
        return;
      }

      setOptions((optData || []) as OptionRow[]);

      // 3) Load current user + their vote + all votes
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      let voterId: string | null = null;
      if (!userError && user) {
        voterId = user.id;
      }

      // Load all votes (for stats)
      const { data: voteData, error: votesError } = await supabase
        .from("votes")
        .select("id, option_id, voter_id")
        .eq("quandr3_id", id);

      if (!mounted) return;

      if (votesError) {
        console.error("Votes load error:", votesError);
        // don’t hard-fail the page; just skip stats
        setVotes([]);
        setUserVotedOptionId(null);
        setLoading(false);
        return;
      }

      const castVotes = (voteData || []) as (VoteRow & {
        voter_id?: string;
      })[];

      setVotes(
        castVotes.map((v) => ({
          id: v.id,
          option_id: v.option_id,
        }))
      );

      if (voterId) {
        const myVote = castVotes.find((v) => v.voter_id === voterId);
        if (myVote) {
          setUserVotedOptionId(myVote.option_id);
        }
      }

      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [id]);

  async function handleVote(optionId: string) {
    if (!quandr3) return;
    if (quandr3.status !== "open") return;

    setError(null);
    setVoting(true);

    try {
      // Ensure user is logged in
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("You need to be logged in to vote.");
        setVoting(false);
        return;
      }

      // Insert vote – unique (quandr3_id, voter_id) enforced in DB
      const { error: voteError } = await supabase.from("votes").insert({
        quandr3_id: quandr3.id,
        option_id: optionId,
        voter_id: user.id,
      });

      if (voteError) {
        console.error("Vote insert error:", voteError);
        setError(
          voteError.message.includes("duplicate") ||
            voteError.message.includes("unique")
            ? "You’ve already voted on this Quandr3."
            : "We couldn’t save your vote. Please try again."
        );
        setVoting(false);
        return;
      }

      // Optimistically update local state
      setUserVotedOptionId(optionId);
      setVotes((prev) => [
        ...prev,
        { id: `local-${Date.now()}`, option_id: optionId },
      ]);
      setVoting(false);
    } catch (e: any) {
      console.error("Unexpected vote error:", e);
      setError("Something went wrong while voting.");
      setVoting(false);
    }
  }

  if (!id) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-slate-600">Loading Quandr3…</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-3 h-7 w-2/3 rounded bg-slate-200 animate-pulse" />
        <div className="mb-1 h-4 w-1/3 rounded bg-slate-200 animate-pulse" />
        <div className="mt-6 space-y-2">
          <div className="h-10 rounded-md bg-slate-100 animate-pulse" />
          <div className="h-10 rounded-md bg-slate-100 animate-pulse" />
          <div className="h-10 rounded-md bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !quandr3) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">
          Quandr3 not found
        </h1>
        <p className="text-sm text-slate-600">
          {error ?? "We couldn’t find that Quandr3."}
        </p>
      </div>
    );
  }

  const isResolved = quandr3.status === "resolved";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header card */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {quandr3.title}
          </h1>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              quandr3.status === "open"
                ? "bg-green-50 text-green-700 border border-green-200"
                : quandr3.status === "resolved"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            {quandr3.status}
          </span>
        </div>
        <div className="mb-2 text-xs text-slate-500">
          <span className="font-medium">{quandr3.category}</span>
          <span className="mx-2">•</span>
          <span>{new Date(quandr3.created_at).toLocaleDateString()}</span>
          {totalVotes > 0 && (
            <>
              <span className="mx-2">•</span>
              <span>
                {totalVotes} vote{totalVotes === 1 ? "" : "s"}
              </span>
            </>
          )}
        </div>
        {quandr3.context && (
          <p className="mt-3 text-sm text-slate-700 whitespace-pre-line">
            {quandr3.context}
          </p>
        )}
      </div>

      {/* Options + voting */}
      <section className="space-y-3">
        {options.map((opt) => {
          const count = voteCounts[opt.id] || 0;
          const percent =
            totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isSelected = userVotedOptionId === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleVote(opt.id)}
              disabled={voting || quandr3.status !== "open" || !!userVotedOptionId}
              className={`flex w-full flex-col items-start rounded-xl border px-4 py-3 text-left text-sm transition ${
                isSelected
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
              } ${
                quandr3.status !== "open" || userVotedOptionId
                  ? "cursor-default"
                  : "cursor-pointer"
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-[11px] font-semibold text-slate-600">
                  {opt.label}
                </span>
                <span className="font-medium text-slate-900">{opt.text}</span>
              </div>

              {showResults && (
                <div className="mt-1 flex w-full items-center gap-2 text-[11px] text-slate-500">
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-blue-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="tabular-nums">
                    {percent}% ({count})
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </section>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {quandr3.status === "open" && !userVotedOptionId && (
        <p className="mt-4 text-xs text-slate-500">
          Percentages stay hidden until you vote. Make your best guess based on
          the context you see.
        </p>
      )}

      {/* ✅ Poster picked (small safe add) */}
      {isResolved && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-1 text-sm font-bold text-slate-900">Poster picked</div>

          {!quandr3.resolved_option_id ? (
            <p className="text-sm text-slate-600">
              This Quandr3 is marked resolved, but the final pick wasn’t found.
            </p>
          ) : (
            <>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {resolvedOption ? (
                  <>
                    {resolvedOption.label}. {resolvedOption.text}
                  </>
                ) : (
                  "Final pick saved — loading details…"
                )}
              </div>

              {quandr3.resolution_note ? (
                <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">
                  {quandr3.resolution_note}
                </p>
              ) : null}

              {quandr3.resolved_at ? (
                <p className="mt-3 text-xs text-slate-500">
                  Resolved on {new Date(quandr3.resolved_at).toLocaleString()}
                </p>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
}
