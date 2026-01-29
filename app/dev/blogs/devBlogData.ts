// app/dev/blogs/devBlogData.ts

export type DevBlogPost = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  content: string;
};

export const DEV_BLOG_POSTS: DevBlogPost[] = [
  {
    slug: "first-test-blog",
    title: "First Test Blog",
    date: "2026-01-12",
    summary: "Quick sanity check that the dev blog routing works without Supabase.",
    content: [
      "# First Test Blog",
      "",
      "This is our *local-only* dev blog post.",
      "",
      "- No database",
      "- No Supabase",
      "- Just a simple TypeScript array",
      "",
      "If you can read this on `/dev/blogs/first-test-blog`,",
      "the Day 1 plan is officially **live**."
    ].join("\n"),
  },
  {
    slug: "dev-log-quandr3-day-1",
    title: "Quandr3 Dev Log – Day 1",
    date: "2026-01-12",
    summary: "Locking in the simplest possible dev log for Quandr3.",
    content: [
      "# Quandr3 Dev Log – Day 1",
      "",
      "Today we locked in the *simplest possible* dev blog:",
      "",
      "- Static data file",
      "- Simple list page",
      "- Simple detail page",
      "",
      "Later, we can swap the data source (filesystem, Supabase, etc.)",
      "without changing the URLs the developer uses."
    ].join("\n"),
  },
];

export function getPostBySlug(slug: string): DevBlogPost | undefined {
  return DEV_BLOG_POSTS.find((post) => post.slug === slug);
}
