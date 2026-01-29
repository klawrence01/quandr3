// app/components/VoteResultsPanel.tsx
"use client";

type OptionResult = {
  label: "A" | "B" | "C" | "D";
  text: string;
  votes: number;
};

type VoteResultsPanelProps = {
  options: OptionResult[];
  totalVotes: number;
  showResults: boolean; // false until user has voted
};

export default function VoteResultsPanel({
  options,
  totalVotes,
  showResults,
}: VoteResultsPanelProps) {
  if (!options.length) return null;

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">
        See how others are leaning
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        {showResults
          ? "These results update in real time."
          : "Results unlock after you vote so answers stay honest."}
      </p>

      <div className="mt-3 space-y-2">
        {options.map((opt) => {
          const pct =
            totalVotes > 0
              ? Math.round((opt.votes / totalVotes) * 100)
              : 0;

          return (
            <div key={opt.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800">
                  {opt.label}. {opt.text}
                </span>
                {showResults && (
                  <span className="font-semibold text-slate-700">
                    {pct}%
                  </span>
                )}
              </div>
              {showResults && (
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showResults && (
        <p className="mt-3 text-[11px] text-slate-500">
          {totalVotes} vote{totalVotes === 1 ? "" : "s"} so far.
        </p>
      )}
    </section>
  );
}
