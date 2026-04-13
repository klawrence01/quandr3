"use client";

import Link from "next/link";

export default function MoneyMovesPage() {
  return (
    <main className="w-full">
      {/* HERO */}
      <section
        className="w-full text-white py-24 px-6 text-center bg-cover bg-center"
        style={{ backgroundImage: "url('/images/money-hero.jpg')" }}
      >
        <div className="bg-black/60 p-8 rounded-xl max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Make Smarter Money Moves.
          </h1>
          <p className="text-lg md:text-xl mb-4">
            Real people. Real financial decisions.
          </p>
          <p className="text-md md:text-lg mb-8 opacity-80">
            See how others are choosing — and why.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/create">
              <button className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold">
                Ask a Money Question
              </button>
            </Link>

            <Link href="/explore?category=money">
              <button className="bg-white text-black px-6 py-3 rounded-lg font-semibold">
                Help Someone Decide
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED QUANDR3s */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10">
          Top Money Quandr3s
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              title: "Should I Pay Off Debt or Invest First? 🔥",
              a: "Kill debt aggressively",
              b: "Invest while paying minimums",
            },
            {
              title: "Is It Smarter to Rent or Buy Right Now?",
              a: "Rent and stay flexible",
              b: "Buy and build equity",
            },
            {
              title: "Should I Pull My Money Out of the Market? ✅",
              a: "Stay the course",
              b: "Move to cash",
            },
            {
              title: "Should I Take a Higher Paying Job I Might Hate? 🔥",
              a: "Chase the money",
              b: "Protect happiness",
            },
          ].map((card, i) => (
            <div
              key={i}
              className="border rounded-xl p-5 shadow-sm hover:shadow-lg transition bg-white"
            >
              <h3 className="font-semibold text-lg mb-3">{card.title}</h3>
              <p className="mb-2">A: {card.a}</p>
              <p>B: {card.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MONEY CTA IMAGE SECTION */}
      <section className="py-16 px-6">
        <div
          className="max-w-6xl mx-auto rounded-2xl overflow-hidden bg-cover bg-center min-h-[420px] flex items-center"
          style={{ backgroundImage: "url('/images/money-cta.jpg')" }}
        >
          <div className="w-full bg-black/55 p-8 md:p-12 text-white">
            <div className="max-w-2xl">
              <p className="uppercase tracking-[0.2em] text-sm mb-3 text-white/80">
                Money Moves
              </p>

              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Don’t Make Big Money Decisions Alone.
              </h2>

              <p className="text-lg md:text-xl text-white/90 mb-8">
                Get perspective before you move. Ask your question, compare real
                reasons, and decide with more clarity.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/create">
                  <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold">
                    Ask a Money Question
                  </button>
                </Link>

                <Link href="/explore?category=money">
                  <button className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">
                    Explore Money Quandr3s
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY SECTION */}
      <section className="bg-gray-100 py-16 px-6 text-center">
        <h2 className="text-2xl font-bold mb-6">
          Why Money Decisions Are So Hard
        </h2>

        <p className="mb-4 text-lg">Money isn’t just numbers.</p>

        <p className="mb-6 font-medium">
          Stress • Freedom • Identity • Risk • Timing
        </p>

        <p className="max-w-2xl mx-auto">
          Most people decide too quickly, too emotionally, or completely alone.
        </p>
      </section>

      {/* HOW QUANDR3 HELPS */}
      <section className="py-16 px-6 text-center">
        <h2 className="text-2xl font-bold mb-6">Quandr3 Changes That</h2>

        <p className="mb-4 text-lg">Instead of guessing…</p>

        <p className="max-w-2xl mx-auto">
          You get multiple perspectives, real reasoning, and the clarity to make
          better financial decisions.
        </p>
      </section>

      {/* CROSS LINKS */}
      <section className="bg-gray-50 py-16 px-6 text-center">
        <h2 className="text-xl font-bold mb-6">Not your only challenge?</h2>

        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/relationships">
            <button className="border px-5 py-2 rounded-lg hover:bg-white transition">
              ❤️ Relationships
            </button>
          </Link>

          <Link href="/career">
            <button className="border px-5 py-2 rounded-lg hover:bg-white transition">
              🚀 Career
            </button>
          </Link>

          <Link href="/blog">
            <button className="border px-5 py-2 rounded-lg hover:bg-white transition">
              👤 Founder’s Page
            </button>
          </Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">
          What Money Decision Are You Facing?
        </h2>

        <p className="mb-8">Ask it. Share it. Decide with clarity.</p>

        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/create">
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold">
              Post Your Question
            </button>
          </Link>

          <Link href="/explore?category=money">
            <button className="border px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">
              Explore More Money Moves
            </button>
          </Link>
        </div>
      </section>
    </main>
  );
}