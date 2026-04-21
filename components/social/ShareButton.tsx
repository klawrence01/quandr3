"use client";

export default function ShareButton({
  quandr3Id,
  title,
  isAuthor,
}: {
  quandr3Id: string;
  title: string;
  isAuthor?: boolean;
}) {
  async function handleShare(e?: any) {
    e?.stopPropagation?.();

    const url = `${window.location.origin}/q/${quandr3Id}`;
    const text = isAuthor
      ? `I posted this on Quandr3—curious what you think. ${title}`
      : `I need your take on this—what would you choose? ${title}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      alert("Link copied");
    } catch {
      alert(url);
    }
  }

  return (
    <button
      onClick={handleShare}
      className="rounded-full border px-3 py-1 text-xs font-medium bg-white"
    >
      Share
    </button>
  );
}