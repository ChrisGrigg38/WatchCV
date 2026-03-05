import { useState, useEffect } from "react";
import type { StoredTracking } from "../types";

const COOKIE_KEY = "watchcv_trackings";

function loadFromCookie(): StoredTracking[] {
  try {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_KEY}=`));
    if (!match) return [];
    const val = decodeURIComponent(match.split("=")[1]);
    return JSON.parse(val) as StoredTracking[];
  } catch {
    return [];
  }
}

function saveToCookie(trackings: StoredTracking[]) {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 2);
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(
    JSON.stringify(trackings)
  )}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

export function useTrackings() {
  const [trackings, setTrackings] = useState<StoredTracking[]>([]);

  useEffect(() => {
    setTrackings(loadFromCookie());
  }, []);

  const addTracking = (trackingId: string, label: string) => {
    const entry: StoredTracking = {
      trackingId,
      label,
      createdAt: new Date().toISOString(),
    };
    const updated = [entry, ...trackings];
    setTrackings(updated);
    saveToCookie(updated);
  };

  const removeTracking = (trackingId: string) => {
    const updated = trackings.filter((t) => t.trackingId !== trackingId);
    setTrackings(updated);
    saveToCookie(updated);
  };

  return { trackings, addTracking, removeTracking };
}