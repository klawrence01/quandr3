"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase/browser";
import { ensureProfile } from "@/utils/supabase/profile";

export default function PostQuandr3Debug() {
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    // 🔹 Make sure profile (and user) exists
    const { user, error: profileError } = await ensureProfile();
    if (profileError || !user) {
      console.error("Profile error:", profileError);
      setMessage("You must be logged in. Go to /auth/login first.");
      setLoading(false);
      return;
    }

    // 🔹 Create Quandr3 (uses profiles.id as foreign key)
    const { data: q, error: qErr } = await supabase
      .from("quandr3s")
      .insert({
        user_id: user.id,
        title,
        context,
        category: "Money", // temp default for debug
        status: "open",
      })
      .select()
      .single();

    if (qErr || !q) {
      console.error("Quandr3 insert error:", qErr);
      setMessage(qErr?.message || "Failed to create Quandr3.");
      setLoading(false);
      return;
    }

    // 🔹 Create choices with labels A–D
    const labels = ["A", "B", "C", "D"];
    const choiceRows = labels.map((label, idx) => ({
      quandr3_id: q.id,
      label,
      text: choices[idx] || `Option ${label}`,
    }));

    const { error: cErr } = await supabase
      .from("quandr3_choices")
      .insert(choiceRows);

    if (cErr) {
      console.error("Choice insert error:", cErr);
      setMessage(cErr.message || "Failed to create choices.");
      setLoading(false);
      return;
    }

    setMessage("Quandr3 created successfully! ID: " + q.id);
    setTitle("");
    setContext("");
    setChoices(["", "", "", ""]);
    setLoading(false);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 40,
        fontFamily: "system-ui",
        background: "#ffffff",
        maxWidth: 640,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        Debug: Post a Quandr3
      </h1>
      <p style={{ fontSize: 14, marginBottom: 20, color: "#444" }}>
        This writes directly to Supabase. Make sure you&apos;re logged in via{" "}
        <code>/auth/login</code>.
      </p>

      <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
        <label
          style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}
        >
          Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 12,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        />

        <label
          style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}
        >
          Context
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          required
          rows={4}
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 16,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        />

        <label
          style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}
        >
          Choices (4 required)
        </label>
        {choices.map((c, i) => (
          <input
            key={i}
            value={c}
            onChange={(e) => {
              const arr = [...choices];
              arr[i] = e.target.value;
              setChoices(arr);
            }}
            required
            placeholder={`Choice ${i + 1}`}
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 8,
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          />
        ))}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 12,
            borderRadius: 8,
            background: loading ? "#00a9a5" : "#1e63f3",
            color: "#fff",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
          }}
        >
          {loading ? "Posting…" : "Submit"}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: 20, fontSize: 15, color: "#333" }}>{message}</p>
      )}
    </main>
  );
}
