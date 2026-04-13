"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  published_at?: string | null;
  created_at?: string;
};

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("blog_type", "founders_note")
      .in("status", ["published", "scheduled"])
      .order("published_at", { ascending: false });

    if (!error && data) {
      setPosts(data as BlogPost[]);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0">
          <img
            src="/assets/founders-notes-banner.jpg"
            alt="Founder’s Notes banner"
            className="h-full w-full object-cover opacity-20"
          />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 py-12">
          <div className="grid gap-8 md:grid-cols-[1.5fr_280px] md:items-center">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                The Founder’s Note
              </p>

              <h1 className="text-4xl font-extrabold text-slate-900 md:text-5xl">
                Founder’s Notes
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
                Thoughts, lessons, and direction behind Quandr3 — why it exists,
                what it stands for, and where it’s going.
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                This is where I share the deeper thinking behind the platform:
                decision-making, perspective, clarity, growth, and the culture
                we’re building together.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
              <img
                src="/assets/founder/kenneth-lawrence.jpg"
                alt="Founder portrait"
                className="mb-4 h-64 w-full rounded-2xl object-cover"
              />

              <div className="text-lg font-bold text-slate-900">
                Kenneth Lawrence
              </div>

              <div className="text-sm text-slate-500">Founder, Quandr3</div>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                Building a place where people can ask, think, share reasoning,
                and arrive at better decisions together.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10">
        <div className="mx-auto max-w-3xl">
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-slate-500">No Founder’s Notes yet.</p>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h2 className="text-xl font-bold text-slate-900">
                    {post.title}
                  </h2>

                  {post.published_at && (
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(post.published_at).toLocaleString()}
                    </p>
                  )}

                  {post.excerpt && (
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      {post.excerpt}
                    </p>
                  )}

                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline"
                  >
                    Read more →
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}