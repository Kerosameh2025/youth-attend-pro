export function getDeviceInfo() {
  if (typeof navigator === "undefined") return { type: "unknown", ua: "" };
  const ua = navigator.userAgent || "";
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
  return {
    type: isMobile ? "mobile" : "desktop",
    ua,
    platform: (navigator as any).platform ?? "",
    lang: navigator.language ?? "",
  } as { type: "mobile" | "desktop" | "unknown"; ua: string; platform: string; lang: string };
}
