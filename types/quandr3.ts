// /Quandr3/types.ts

export type Quandr3Status = "open" | "awaiting_user" | "resolved";

export type Quandr3Visibility =
  | "public"
  | "private"
  | "campus"
  | "regional"
  | "unlisted";

export type Quandr3Option = {
  label: "A" | "B" | "C" | "D";
  text: string;
  media_url?: string | null;
  id?: string;
  meta?: Record<string, any>;
};

export type Quandr3Row = {
  id: string;
  author_id: string | null;
  category: string | null;
  title: string | null;
  context: string | null;

  media_url: string | null;
  media_type: string | null;
  hero_image_url: string | null;

  status: Quandr3Status | string | null;
  created_at: string | null;
  closes_at: string | null;

  resolved_at: string | null;
  resolved_by: string | null;
  resolved_option_id: string | null;
  resolved_choice_label: string | null;

  outcome_text: string | null;
  final_choice: string | null;
  final_note: string | null;
  resolution_note: string | null;

  options: Quandr3Option[] | null;

  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;

  option_media_urls: string[] | null;

  city: string | null;
  state: string | null;
  region: string | null;
  country: string | null;
  campus_id: string | null;

  visibility: Quandr3Visibility | string | null;

  time_limit_hours: number | null;
  voting_duration_hours: number | null;
  voting_max_votes: number | null;

  resolution_window: string | null;

  discussion_open: boolean | null;
  reasoning: string | null;

  debate_requested: boolean | null;
  debate_requested_at: string | null;

  sponsored_start: string | null;
  sponsored_end: string | null;
  sponsored_bid: number | null;
  sponsored_owner_id: string | null;
};

export function normalizeOptions(q: Quandr3Row): Quandr3Option[] {
  if (Array.isArray(q.options) && q.options.length) return q.options;

  const legacy = [q.option_a, q.option_b, q.option_c, q.option_d]
    .map((text, i) => {
      const label = (["A", "B", "C", "D"][i] as "A" | "B" | "C" | "D");
      if (!text) return null;

      const media_url = Array.isArray(q.option_media_urls)
        ? q.option_media_urls[i] ?? null
        : null;

      return { label, text, media_url };
    })
    .filter(Boolean) as Quandr3Option[];

  return legacy;
}
