// app/dev/blogs/[slug]/page.tsx
import Link from "next/link";
import { getPostBySlug } from "../devBlogData";

type PageProps = {
  params: { slug: string };
};

export default function DevBlogSlugPage({ params }: PageProps) {
  const post = getPostBySlug(params.slug);

  if (!post) {
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
        <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 16 }}>
          Blog Not Found
        </h1>
        <p style={{ marginBottom: 24 }}>
          We couldn’t find a dev blog with slug:{" "}
          <strong>{params.slug}</strong>
        </p>
        <p>
          <Link href="/dev/blogs">← Back to dev blogs</Link>
        </p>
      </main>
    );
  }

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
      <p
        style={{
          fontSize: 13,
          textTransform: "uppercase",
          letterSpacing: 0.08,
          opacity: 0.6,
          marginBottom: 4,
        }}
      >
        {post.date}
      </p>

      <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 16 }}>
        {post.title}
      </h1>

      <article
        style={{
          marginTop: 24,
          whiteSpace: "pre-wrap",
        }}
      >
        {post.content}
      </article>

      <p style={{ marginTop: 40 }}>
        <Link href="/dev/blogs">← Back to dev blogs</Link>
      </p>
    </main>
  );
}
