// app/dev/blogs/page.tsx
import Link from "next/link";
import { DEV_BLOG_POSTS } from "./devBlogData";

export default function DevBlogsIndexPage() {
  return (
    <main
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "64px 24px",
        fontFamily: "system-ui",
        lineHeight: 1.6,
      }}
    >
      <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 8 }}>
        Dev Blog
      </h1>
      <p style={{ marginBottom: 32, opacity: 0.8 }}>
        Internal notes and build logs for Quandr3. (Day 1: local data only.)
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {DEV_BLOG_POSTS.map((post) => (
          <article
            key={post.slug}
            style={{
              padding: 16,
              borderRadius: 12,
              background: "#f7f7f8",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
              <Link
                href={`/dev/blogs/${post.slug}`}
                style={{ textDecoration: "none", color: "#0b0b0b" }}
              >
                {post.title}
              </Link>
            </h2>
            <p
              style={{
                margin: "4px 0 8px",
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: 0.08,
                opacity: 0.6,
              }}
            >
              {post.date}
            </p>
            <p style={{ margin: 0, opacity: 0.9 }}>{post.summary}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
