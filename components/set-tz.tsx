"use client";

import { useEffect } from "react";

// Sets a cookie with the user's timezone offset (minutes west of UTC, per
// Date.prototype.getTimezoneOffset). Server reads it to bucket activity into
// local-calendar days instead of UTC days.
//
// On the very first visit there's no cookie yet, so the page renders with UTC
// dates. Once the cookie is set we reload once so the heatmap renders correctly.
// Subsequent DST shifts or timezone changes take effect on the next navigation.
export function SetTimezone() {
  useEffect(() => {
    const offset = String(new Date().getTimezoneOffset());
    const match = document.cookie.match(/(?:^|;\s*)tz_offset_minutes=(-?\d+)/);
    const had = !!match;
    const current = match?.[1];
    if (current === offset) return;
    document.cookie = `tz_offset_minutes=${offset}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    if (!had) {
      window.location.reload();
    }
  }, []);
  return null;
}
