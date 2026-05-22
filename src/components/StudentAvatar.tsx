import { useEffect, useState } from "react";
import { getSignedPhotoUrl } from "@/lib/storage";

export function StudentAvatar({ path, name, size = 48 }: { path: string | null; name: string; size?: number }) {
  const [url, setUrl] = useState<string | null>(null);
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

  return (
    <div
      className="rounded-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden flex-shrink-0 font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {url ? <img src={url} alt={name} className="w-full h-full object-cover" /> : <span>{initials}</span>}
    </div>
  );
}
