// app/components/MediaBlock.tsx
"use client";

type MediaBlockProps = {
  mediaUrl?: string | null;
};

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);

    // https://www.youtube.com/watch?v=XXXX
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v");
    }

    // https://youtu.be/XXXX
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "") || null;
    }

    return null;
  } catch {
    return null;
  }
}

function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|webp|gif|svg)$/i.test(url);
}

export default function MediaBlock({ mediaUrl }: MediaBlockProps) {
  if (!mediaUrl) return null;

  const ytId = getYouTubeId(mediaUrl);

  return (
    <section className="mt-6">
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-500">
        Media (optional)
      </h3>

      {/* YouTube embed */}
      {ytId && (
        <div className="relative w-full overflow-hidden rounded-xl bg-slate-900/5 pb-[56.25%] shadow-sm">
          <iframe
            className="absolute inset-0 h-full w-full rounded-xl"
            src={`https://www.youtube.com/embed/${ytId}`}
            title="Quandr3 media"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Image */}
      {!ytId && isImageUrl(mediaUrl) && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl}
            alt="Attached to this Quandr3"
            className="h-auto w-full max-h-[420px] object-cover"
          />
        </div>
      )}

      {/* Fallback generic link */}
      {!ytId && !isImageUrl(mediaUrl) && (
        <a
          href={mediaUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-blue-600 shadow-sm hover:border-blue-400 hover:bg-blue-50/40"
        >
          <span>Open attached link</span>
          <span className="text-xs text-slate-400">Opens in new tab</span>
        </a>
      )}
    </section>
  );
}
