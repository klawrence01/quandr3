"use client";

import Link from "next/link";

export default function CareerPage() {
  return (
    <main className="w-full">

      {/* HERO */}
      <section
        className="w-full text-white py-24 px-6 text-center bg-cover bg-center"
        style={{ backgroundImage: "url('/images/career-hero.jpg')" }}
      >
        <div className="bg-black/55 p-8 rounded-xl max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Make Smarter Career Moves.
          </h1>

          <p className="text-lg md:text-xl mb-4">
            Real people. Real career decisions.
          </p>

          <p className="text-sm md:text-md mb-6 opacity-80">
            See what others would do — before you decide.
          </p>

          <p className="text-md md:text-lg mb-8 opacity-90 max-w-3xl mx-auto">
            Jobs, promotions, pivots, pressure, purpose — your next move matters.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/create">
              <button className="bg-cyan-600 hover:bg-cyan-700 px-6 py-3 rounded-lg font-semibold">
                Ask a Career Question
              </button>
            </Link>

            <Link href="/explore?category=career">
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
          Top Career Quandr3s
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/q/1">
            <div className="border rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition bg-white">
              <h3 className="font-semibold text-lg mb-3">
                Should I Take the Safer Job or Bet on Myself?
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded ml-2">
                  Active
                </span>
              </h3>
              <p className="mb-2">A: Take the stable job</p>
              <p>B: Bet on myself and build</p>
            </div>
          </Link>

          <Link href="/q/2">
            <div className="border rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition bg-white">
              <h3 className="font-semibold text-lg mb-3">
                Is It Time to Leave This Company?
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded ml-2">
                  Awaiting User
                </span>
              </h3>
              <p className="mb-2">A: Stay a little longer</p>
              <p>B: Start planning my exit now</p>
            </div>
          </Link>

          <Link href="/q/3">
            <div className="border rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition bg-white">
              <h3 className="font-semibold text-lg mb-3">
                Should I Ask for the Raise?
                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded ml-2">
                  Resolved
                </span>
              </h3>
              <p className="mb-2">A: Ask now and be direct</p>
              <p>B: Wait and build more leverage</p>
            </div>
          </Link>

          <Link href="/q/4">
            <div className="border rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition bg-white">
              <h3 className="font-semibold text-lg mb-3">
                Am I Building a Career or Just Paying Bills?
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded ml-2">
                  Active
                </span>
              </h3>
              <p className="mb-2">A: Stay practical for now</p>
              <p>B: Start moving toward purpose</p>
            </div>
          </Link>
        </div>
      </section>

      {/* CAREER CTA IMAGE SECTION */}
      <section className="py-16 px-6">
        <div
          className="max-w-6xl mx-auto rounded-2xl overflow-hidden bg-cover bg-center min-h-[420px] flex items-center"
          style={{ backgroundImage: "url('/images/career-cta.jpg')" }}
        >
          <div className="w-full bg-black/50 p-8 md:p-12 text-white">
            <div className="max-w-2xl">
              <p className="uppercase tracking-[0.2em] text-sm mb-3 text-white/80">
                Career
              </p>

              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Don’t Make Career Decisions in the Dark.
              </h2>

              <p className="text-lg md:text-xl text-white/90 mb-8">
                Get real perspective before your next move — and step forward with confidence.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/create">
                  <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-semibold">
                    Ask a Career Question
                  </button>
                </Link>

                <Link href="/explore?category=career">
                  <button className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">
                    Explore Career Quandr3s
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY SECTION */}
      <section className="bg-cyan-50 py-16 px-6 text-center">
        <h2 className="text-2xl font-bold mb-6">
          Why Career Decisions Carry So Much Weight
        </h2>

        <p className="mb-4 text-lg">Career choices shape more than income.</p>

        <p className="mb-6">
          Time • Identity • Confidence • Family • Opportunity • Future
        </p>

        <p className="max-w-2xl mx-auto">
          That’s why people stay stuck, move too soon, play too small, or keep
          building a life they don’t really want.
        </p>
      </section>

      {/* HOW QUANDR3 HELPS */}
      <section className="py-16 px-6 text-center">
        <h2 className="text-2xl font-bold mb-6">Quandr3 Helps You Think Longer</h2>

        <p className="mb-4 text-lg">Before you make your next move…</p>

        <p className="max-w-2xl mx-auto">
          You can hear real perspectives from people who understand tradeoffs,
          timing, ambition, and consequence.
        </p>
      </section>

      {/* CROSS LINKS */}
      <section className="bg-gray-50 py-16 px-6 text-center">
        <h2 className="text-xl font-bold mb-6">Need clarity in other areas too?</h2>

        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/money-moves">
            <button className="border px-5 py-2 rounded-lg">
              💰 Money Moves
            </button>
          </Link>

          <Link href="/relationships">
            <button className="border px-5 py-2 rounded-lg">
              ❤️ Relationships
            </button>
          </Link>

          <Link href="/blog">
            <button className="border px-5 py-2 rounded-lg">
              👤 Founder’s Page
            </button>
          </Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">
          What Career Decision Are You Facing?
        </h2>

        <p className="mb-8">
          Ask it. Share it. Decide with more direction.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/create">
            <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-semibold">
              Post Your Question
            </button>
          </Link>

          <Link href="/explore?category=career">
            <button className="border px-6 py-3 rounded-lg font-semibold">
              Explore More Career Questions
            </button>
          </Link>
        </div>
      </section>

    </main>
  );
}