"use client";

import BlogQueueClient from "./BlogQueueClient";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/browser";

type BlogStatus = "draft" | "scheduled" | "published" | "archived";
type BlogType = "product" | "culture" | "community" | "founders_note";

type BlogPost = {
  id: string;
  title: string;
  excerpt?: string | null;
  status: BlogStatus;
  blog_type: BlogType;
  published_at?: string | null;
  scheduled_at?: string | null;
};

export default function BlogQueuePage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setPosts((data as BlogPost[]) || []);
    setLoading(false);
  }

  if (loading) {
    return <div className="p-6">Loading blog queue...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return <BlogQueueClient initialPosts={posts} />;
}