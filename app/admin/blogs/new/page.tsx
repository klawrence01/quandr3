"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/browser";

type BlogStatus = "draft" | "scheduled" | "published";
type BlogType = "product" | "culture" | "community" | "founders_note";

const NAVY = "#0b2343";
const BLUE = "#1e63f3";
const TEAL = "#00a9a5";
const CORAL = "#ff6b6b";
const SOFT_BG = "#f7f9ff";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewBlogPostPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [blogType, setBlogType] = useState<BlogType>("founders_note");
  const [status, setStatus] = useState<BlogStatus>("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);

  const slug = useMemo(() => slugify(title), [title]);

  async function handleSave() {
    if (!title.trim()) {
      alert("Title is required.");
      return;
    }

    if (!content.trim()) {
      alert("Content is required.");
      return;
    }

    if (status === "scheduled" && !scheduledAt) {
      alert("Choose a scheduled date and time.");
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        title: title.trim(),
        slug,
        excerpt: excerpt.trim() || null,
        content: content.trim(),
        blog_type: blogType,
        status,
        scheduled_at: status === "scheduled" ? new Date(scheduledAt).toISOString() : null,
        published_at: status === "published" ? new Date().toISOString() : null,
      };

      const { error } = await supabase.from("blogs").insert(payload);

      if (error) {
        alert(error.message);
        return;
      }

      router.push("/admin/blogs/queue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT_BG,
        padding: "40px 24px 64px",
        fontFamily: "system-ui",
        color: NAVY,
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 24,
          padding: 24,
          boxShadow: "0 16px 40px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 32,
                fontWeight: 900,
                letterSpacing: -0.4,
              }}
            >
              New Blog Post
            </h1>
            <p style={{ marginTop: 8, fontSize: 14, opacity: 0.8 }}>
              Create a blog post, Founder’s Note, or scheduled entry for the queue.
            </p>
          </div>

          <button
            onClick={() => router.push("/admin/blogs/queue")}
            style={{
              border: "1px solid rgba(11,35,67,0.14)",
              background: "#fff",
              color: NAVY,
              borderRadius: 999,
              padding: "10px 16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Back to Queue
          </button>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontWeight: 800, marginBottom: 6 }}>
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              style={{
                width: "100%",
                border: "1px solid rgba(11,35,67,0.12)",
                borderRadius: 14,
                padding: "12px 14px",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 800, marginBottom: 6 }}>
              Slug
            </label>
            <input
              value={slug}
              readOnly
              style={{
                width: "100%",
                border: "1px solid rgba(11,35,67,0.12)",
                borderRadius: 14,
                padding: "12px 14px",
                fontSize: 14,
                outline: "none",
                background: "#f8fafc",
                color: "rgba(11,35,67,0.75)",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 800, marginBottom: 6 }}>
              Excerpt
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary for the queue and previews"
              rows={3}
              style={{
                width: "100%",
                border: "1px solid rgba(11,35,67,0.12)",
                borderRadius: 14,
                padding: "12px 14px",
                fontSize: 14,
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            <div>
              <label style={{ display: "block", fontWeight: 800, marginBottom: 6 }}>
                Blog Type
              </label>
              <select
                value={blogType}
                onChange={(e) => setBlogType(e.target.value as BlogType)}
                style={{
                  width: "100%",
                  border: "1px solid rgba(11,35,67,0.12)",
                  borderRadius: 14,
                  padding: "12px 14px",
                  fontSize: 14,
                  outline: "none",
                  background: "#fff",
                }}
              >
                <option value="product">Product</option>
                <option value="culture">Culture & Ideas</option>
                <option value="community">Community</option>
                <option value="founders_note">Founder’s Notes</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 800, marginBottom: 6 }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BlogStatus)}
                style={{
                  width: "100%",
                  border: "1px solid rgba(11,35,67,0.12)",
                  borderRadius: 14,
                  padding: "12px 14px",
                  fontSize: 14,
                  outline: "none",
                  background: "#fff",
                }}
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Publish Now</option>
              </select>
            </div>
          </div>

          {status === "scheduled" && (
            <div>
              <label style={{ display: "block", fontWeight: 800, marginBottom: 6 }}>
                Schedule For
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: 320,
                  border: "1px solid rgba(11,35,67,0.12)",
                  borderRadius: 14,
                  padding: "12px 14px",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontWeight: 800, marginBottom: 6 }}>
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post here..."
              rows={16}
              style={{
                width: "100%",
                border: "1px solid rgba(11,35,67,0.12)",
                borderRadius: 16,
                padding: "14px 16px",
                fontSize: 14,
                outline: "none",
                resize: "vertical",
                lineHeight: 1.5,
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "12px 20px",
                background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`,
                color: "#fff",
                fontWeight: 800,
                fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
              }}
            >
              {loading ? "Saving..." : "Save Post"}
            </button>

            <button
              onClick={() => router.push("/admin/blogs/queue")}
              style={{
                border: "1px solid rgba(11,35,67,0.14)",
                background: "#fff",
                color: NAVY,
                borderRadius: 999,
                padding: "12px 20px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}