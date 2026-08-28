import { site } from "@/lib/content";

function normalizeOrigin(value: string | undefined | null) {
  const trimmed = value?.trim().replace(/\/$/, "");
  return trimmed || null;
}

export function publicOrigin(req?: Request) {
  const configured = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  if (configured) return configured;

  if (req) {
    const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const host = forwardedHost || req.headers.get("host");
    if (host) {
      const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
      const proto = forwardedProto || new URL(req.url).protocol.replace(":", "") || "https";
      return `${proto}://${host}`;
    }

    return new URL(req.url).origin;
  }

  return site.url;
}

export function publicUrl(path: string, req?: Request) {
  return new URL(path, publicOrigin(req));
}
