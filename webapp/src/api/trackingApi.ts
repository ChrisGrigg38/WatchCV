const BASE = "/api";

export async function createTracking(): Promise<{ trackingId: string }> {
  const res = await fetch(`${BASE}/createTracking`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create tracking");
  }
  return res.json();
}

export async function getTracking(trackingId: string) {
  const res = await fetch(`${BASE}/getTracking?trackingId=${encodeURIComponent(trackingId)}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to get tracking");
  }
  return res.json();
}