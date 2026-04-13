"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/browser";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  content_md?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  blog_type?: string | null;
  status?: string | null;
};

export default function BlogPostPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!slug) return;

    async function loadPost() {
      setLoading(true);

      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("slug", slug)
        .eq("blog_type", "founders_note")
        .order("published_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("BLOG DETAIL QUERY ERROR:", error);
        setMissing(true);
        setLoading(false);
        return;
      }

      const found = data?.[0] as BlogPost | undefined;

      if (!found) {
        setMissing(true);
        setLoading(false);
        return;
      }

      setPost(found);
      setLoading(false);
    }

    loadPost();
  }, [slug]);

  if (missing) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/blog"
          className="mb-6 inline-block text-sm font-semibold text-blue-600 hover:underline"
        >
          ← Back to Founder’s Notes
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : post ? (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {post.blog_type === "founders_note" ? "Founder’s Note" : "Blog"}
              </p>

              <h1 className="text-3xl font-extrabold text-slate-900 md:text-4xl">
                {post.title}
              </h1>

              {post.published_at && (
                <p className="mt-2 text-sm text-slate-500">
                  {new Date(post.published_at).toLocaleString()}
                </p>
              )}

              {post.excerpt && (
                <p className="mt-6 text-lg leading-8 text-slate-700">
                  {post.excerpt}
                </p>
              )}

              <article className="mt-8 whitespace-pre-wrap text-base leading-8 text-slate-800">
                {post.content_md || post.content || ""}
              </article>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}