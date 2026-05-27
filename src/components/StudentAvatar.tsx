import { useEffect, useState } from "react";
import { getSignedPhotoUrl } from "@/lib/storage";
import { PhotoLightbox } from "@/components/PhotoLightbox";

export function StudentAvatar({
  path,
  name,
  size = 48,
  enlargeable = false,
}: {
  path: string | null;
  name: string;
  size?: number;
  enlargeable?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let mounted = true;
    if (path) {
      getSignedPhotoUrl(path).then((u) => { if (mounted) setUrl(u); });
    } else {
      setUrl(null);
    }
    return () => { mounted = false; };
  }, [path]);

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const clickable = enlargeable && !!url;

  return (
    <>
      <div
        onClick={clickable ? (e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); } : undefined}
        className={`rounded-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden flex-shrink-0 font-semibold ${clickable ? "cursor-zoom-in hover:ring-2 hover:ring-primary/40 transition" : ""}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {url ? <img src={url} alt={name} className="w-full h-full object-cover" /> : <span>{initials}</span>}
      </div>
      {clickable && open && (
        <PhotoLightbox url={url} alt={name} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
