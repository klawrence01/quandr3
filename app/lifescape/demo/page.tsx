"use client";
// @ts-nocheck

import { useEffect, useMemo, useState } from "react";

const liveImages = [
  {
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176",
    sender: "Mom",
    role: "Family",
    date: "2026-05-02",
    caption: "Jaxon walking into the room and realizing everybody showed up for him.",
    comments: [
      { name: "Mom", text: "Look at that smile ❤️" },
      { name: "Dad", text: "That’s my boy." },
      { name: "Aunt Lisa", text: "This picture says everything." },
    ],
  },
  {
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac",
    sender: "Marcus",
    role: "Friend",
    date: "2026-05-02",
    caption: "The crew getting loud when the cake came out.",
    comments: [
      { name: "Marcus", text: "Bro was hype 😂" },
      { name: "Jay", text: "Best moment of the night." },
      { name: "Tina", text: "Everybody was smiling." },
    ],
  },
  {
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d",
    sender: "Aunt Lisa",
    role: "Family",
    date: "2026-05-02",
    caption: "Cake, candles, and everybody singing together.",
    comments: [
      { name: "Aunt Lisa", text: "I love this one." },
      { name: "Mom", text: "Sixteen already. Wow." },
      { name: "Uncle Ray", text: "That’s the moment right there!" },
    ],
  },
  {
    image: "https://images.unsplash.com/photo-1464349153735-7db50ed83c84",
    sender: "Dad",
    role: "Family",
    date: "2026-05-02",
    caption: "One of those pictures we’ll look back on years from now.",
    comments: [
      { name: "Dad", text: "Proud moment." },
      { name: "Coach", text: "Young man is growing up." },
      { name: "Mom", text: "This belongs in the family archive." },
    ],
  },
  {
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
    sender: "Coach",
    role: "Mentor",
    date: "2026-05-02",
    caption: "The whole room celebrating him.",
    comments: [
      { name: "Coach", text: "Keep leading, young man." },
      { name: "Friend", text: "Legendary night." },
      { name: "Dad", text: "Appreciate you being here, Coach." },
    ],
  },
];

const attendees = [
  { name: "Mom", note: "Taking pictures nonstop ❤️" },
  { name: "Dad", note: "Proud and emotional" },
  { name: "Coach", note: "Dropped in with encouragement" },
  { name: "Aunt Lisa", note: "Posting family memories" },
  { name: "Jay", note: "Reacting to every photo" },
  { name: "Marcus", note: "Friend crew energy" },
  { name: "Tina", note: "Sending love from the room" },
];

const memories = [
  {
    name: "Mom",
    role: "Family",
    date: "2026-05-02",
    tag: "Today",
    text: "I prayed for you before you were even here. Watching you turn 16… I’m overwhelmed with gratitude.",
    image: "https://images.unsplash.com/photo-1511895426328-dc8714191300",
  },
  {
    name: "Dad",
    role: "Family",
    date: "2026-05-02",
    tag: "Today",
    text: "Sixteen years went by fast. Proud of the young man you’re becoming.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
  },
  {
    name: "Friend",
    role: "Friend",
    date: "2026-05-02",
    tag: "Today",
    text: "We’ve had too many funny moments to count. Happy birthday, bro!",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac",
  },
  {
    name: "Coach",
    role: "Mentor",
    date: "2026-04-29",
    tag: "This Week",
    text: "Keep showing up. Keep leading. Your future is bright.",
    image: "https://images.unsplash.com/photo-1526676037777-05a232554f77",
  },
  {
    name: "Aunt Lisa",
    role: "Family",
    date: "2026-04-28",
    tag: "This Week",
    text: "I remember when you were little and always smiling. You’ve always brought joy into every room.",
    image: "https://images.unsplash.com/photo-1464349153735-7db50ed83c84",
  },
];

export default function LifeScapeDemo() {
  const [index, setIndex] = useState(0);
  const [dateFilter, setDateFilter] = useState("all");
  const [searchQ, setSearchQ] = useState("");

  const current = liveImages[index];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % liveImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const visibleMemories = useMemo(() => {
    return memories.filter((m) => {
      const q = searchQ.trim().toLowerCase();

      const matchesSearch =
        !q ||
        `${m.name} ${m.role} ${m.text} ${m.date} ${m.tag}`
          .toLowerCase()
          .includes(q);

      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "today" && m.date === "2026-05-02") ||
        (dateFilter === "week" && ["Today", "This Week"].includes(m.tag));

      return matchesSearch && matchesDate;
    });
  }, [dateFilter, searchQ]);

  return (
    <main className="min-h-screen bg-[#f7f2ea] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* HERO */}
        <section className="mb-6 rounded-[32px] bg-white p-6 shadow-md">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-red-600">
            LifeScape Birthday Live
          </p>

          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight md:text-6xl">
                Jaxon’s 16th Birthday 🎉
              </h1>
              <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600">
                Photos, reactions, attendees, and birthday memories coming in live
                from everyone who loves him.
              </p>
            </div>

            <button className="rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-lg">
              Create My Event
            </button>
          </div>
        </section>

        {/* LIVE SCREEN */}
        <section className="overflow-hidden rounded-[34px] bg-black text-white shadow-2xl">
          <div className="flex items-center justify-between bg-red-600 px-5 py-3 text-sm font-black">
            <span>🔴 BIRTHDAY LIVE</span>
            <span>{attendees.length} people here</span>
          </div>

          <div className="relative">
            <img
              src={current.image}
              className="h-[380px] w-full object-cover md:h-[480px]"
              alt=""
            />

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5">
              <div className="inline-flex rounded-full bg-black/70 px-4 py-2 text-sm font-black">
                Sent by {current.sender} • {current.role} • Live
              </div>

              <h2 className="mt-3 max-w-3xl text-2xl font-black md:text-4xl">
                {current.caption}
              </h2>

              <p className="mt-2 text-sm text-white/75">
                Uploaded {new Date(current.date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-2 px-5 py-4">
            {liveImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-3 w-3 rounded-full transition ${
                  i === index ? "bg-white scale-125" : "bg-white/40"
                }`}
                aria-label={`View live photo ${i + 1}`}
              />
            ))}
          </div>

          <div className="border-t border-white/10 px-5 py-5">
            <div className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-white/60">
              Live comments on this photo
            </div>

            <div className="space-y-2">
              {current.comments.map((c, i) => (
                <div key={i} className="rounded-2xl bg-white/10 px-4 py-3 text-sm">
                  <span className="font-black">{c.name}:</span> {c.text}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ATTENDEES */}
        <section className="mt-7 rounded-[32px] bg-white p-6 shadow-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Who’s Here</h2>
              <p className="mt-1 text-sm text-slate-500">
                Attendees and family members reacting live.
              </p>
            </div>

            <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">
              Live room
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {attendees.map((a, i) => (
              <div key={i} className="rounded-2xl border bg-slate-50 p-4">
                <div className="font-black">{a.name}</div>
                <p className="mt-1 text-sm text-slate-600">{a.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SEARCH + FILTERS */}
        <section className="mt-8 rounded-[32px] bg-white p-6 shadow-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">Birthday Wishes & Memories</h2>
              <p className="mt-1 text-sm text-slate-500">
                Search later by person, date, memory, or event moment.
              </p>
            </div>

            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search memories..."
              className="rounded-full border px-5 py-3 text-sm outline-none md:w-[280px]"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { key: "all", label: "All Memories" },
              { key: "today", label: "Today" },
              { key: "week", label: "This Week" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setDateFilter(f.key)}
                className={`rounded-full px-4 py-2 text-sm font-black ${
                  dateFilter === f.key
                    ? "bg-slate-950 text-white"
                    : "border bg-white text-slate-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {visibleMemories.map((m, i) => (
              <article
                key={i}
                className="overflow-hidden rounded-[28px] border bg-white shadow-sm"
              >
                <div className="relative">
                  <img src={m.image} className="h-48 w-full object-cover" alt="" />

                  <div className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-xs font-black text-white">
                    Sent by {m.name}
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black">{m.name}</h3>
                      <p className="text-sm font-bold text-amber-600">{m.role}</p>
                    </div>

                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                      {m.tag}
                    </span>
                  </div>

                  <p className="leading-7 text-slate-700">“{m.text}”</p>

                  <p className="mt-4 text-xs font-semibold text-slate-400">
                    {new Date(m.date).toLocaleDateString()}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}