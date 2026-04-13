"use client";

import Link from "next/link";

export default function RelationshipsPage() {
  return (
    <main className="w-full">
      {/* HERO */}
      <section
        className="w-full text-white py-24 px-6 text-center bg-cover bg-center"
        style={{ backgroundImage: "url('/images/relationships-hero.jpg')" }}
      >
        <div className="bg-black/55 p-8 rounded-xl max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Make Better Relationship Decisions.
          </h1>

          <p className="text-lg md:text-xl mb-4">
            Real people. Real relationship dilemmas.
          </p>

          <p className="text-md md:text-lg mb-8 opacity-90 max-w-3xl mx-auto">
            Love, family, friendship, trust, boundaries — when emotions are high,
            clarity matters.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/create">
              <button className="bg-pink-600 hover:bg-pink-700 px-6 py-3 rounded-lg font-semibold">
                Ask a Relationship Question
              </button>
            </Link>

            <Link href="/explore?category=relationships">
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
          Top Relationship Quandr3s
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/q/1">
            <div className="border rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition bg-white">
              <h3 className="font-semibold text-lg mb-3">
                Should I Stay or Walk Away?
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded ml-2">
                  Active
                </span>
              </h3>
              <p className="mb-2">A: Stay and keep trying</p>
              <p>B: Leave and protect my peace</p>
            </div>
          </Link>

          <Link href="/q/2">
            <div className="border rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition bg-white">
              <h3 className="font-semibold text-lg mb-3">
                Do I Tell the Truth Even If It Hurts?
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded ml-2">
                  Awaiting User
                </span>
              </h3>
              <p className="mb-2">A: Tell the truth now</p>
              <p>B: Wait for a better moment</p>
            </div>
          </Link>

          <Link href="/q/3">
            <div className="border rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition bg-white">
              <h3 className="font-semibold text-lg mb-3">
                Should I Give This Friendship Another Chance?
                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded ml-2">
                  Resolved
                </span>
              </h3>
              <p className="mb-2">A: Reopen the door</p>
              <p>B: Let it go for good</p>
            </div>
          </Link>

          <Link href="/q/4">
            <div className="border rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition bg-white">
              <h3 className="font-semibold text-lg mb-3">
                Am I Being Patient or Just Being Played?
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded ml-2">
                  Active
                </span>
              </h3>
              <p className="mb-2">A: Be patient and give it time</p>
              <p>B: Stop ignoring the signs</p>
            </div>
          </Link>
        </div>
      </section>

      {/* RELATIONSHIPS CTA IMAGE SECTION */}
      <section className="py-16 px-6">
        <div
          className="max-w-6xl mx-auto rounded-2xl overflow-hidden bg-cover bg-center min-h-[420px] flex items-center"
          style={{ backgroundImage: "url('/images/relationships-cta.jpg')" }}
        >
          <div className="w-full bg-black/50 p-8 md:p-12 text-white">
            <div className="max-w-2xl">
              <p className="uppercase tracking-[0.2em] text-sm mb-3 text-white/80">
                Relationships
              </p>

              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Don’t Navigate Relationship Decisions Alone.
              </h2>

              <p className="text-lg md:text-xl text-white/90 mb-8">
                When trust, love, or boundaries are on the line, perspective can
                change everything.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/create">
                  <button className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold">
                    Ask a Relationship Question
                  </button>
                </Link>

                <Link href="/explore?category=relationships">
                  <button className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">
                    Explore Relationship Quandr3s
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY SECTION */}
      <section className="bg-rose-50 py-16 px-6 text-center">
        <h2 className="text-2xl font-bold mb-6">
          Why Relationship Decisions Hit So Deep
        </h2>

        <p className="mb-4 text-lg">Relationships are rarely just logic.</p>

        <p className="mb-6">
          Hope • Fear • Loyalty • Memory • Chemistry • Pain
        </p>

        <p className="max-w-2xl mx-auto">
          That’s why people stay too long, leave too soon, say too much, or say
          nothing at all.
        </p>
      </section>

      {/* HOW QUANDR3 HELPS */}
      <section className="py-16 px-6 text-center">
        <h2 className="text-2xl font-bold mb-6">Quandr3 Brings Perspective</h2>

        <p className="mb-4 text-lg">Instead of reacting in the moment…</p>

        <p className="max-w-2xl mx-auto">
          You can slow down, share the real situation, and hear how thoughtful
          people would respond — and why.
        </p>
      </section>

      {/* CROSS LINKS */}
      <section className="bg-gray-50 py-16 px-6 text-center">
        <h2 className="text-xl font-bold mb-6">Need clarity somewhere else too?</h2>

        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/money-moves">
            <button className="border px-5 py-2 rounded-lg">
              💰 Money Moves
            </button>
          </Link>

          <Link href="/career">
            <button className="border px-5 py-2 rounded-lg">
              🚀 Career
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
          What Relationship Decision Are You Facing?
        </h2>

        <p className="mb-8">
          Ask it. Share it. Decide with more clarity.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/create">
            <button className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold">
              Post Your Question
            </button>
          </Link>

          <Link href="/explore?category=relationships">
            <button className="border px-6 py-3 rounded-lg font-semibold">
              Explore More Relationship Questions
            </button>
          </Link>
        </div>
      </section>
    </main>
  );
}