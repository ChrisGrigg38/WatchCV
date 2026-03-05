/**
 * Given an IPv4 address, return the /24 network range start and end.
 * e.g. 192.168.1.45 → { start: "192.168.1.0", end: "192.168.1.255" }
 * For IPv6 or unusual formats, we fall back to the exact IP as both start/end.
 */
function getIpRange(ip) {
  if (!ip) return { start: "0.0.0.0", end: "0.0.0.0" };

  // Strip IPv6-mapped IPv4
  const cleaned = ip.replace(/^::ffff:/, "");

  const parts = cleaned.split(".");
  if (parts.length === 4) {
    const base = `${parts[0]}.${parts[1]}.${parts[2]}`;
    return { start: `${base}.0`, end: `${base}.255` };
  }

  // IPv6 — use /48 prefix (first 3 groups)
  const v6parts = cleaned.split(":");
  if (v6parts.length >= 3) {
    const prefix = v6parts.slice(0, 3).join(":");
    return { start: `${prefix}::`, end: `${prefix}:ffff:ffff:ffff:ffff:ffff` };
  }

  return { start: cleaned, end: cleaned };
}

/**
 * Extract the real client IP from Netlify/Lambda headers
 */
function getClientIp(event) {
  const headers = event.headers || {};
  return (
    headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    headers["client-ip"] ||
    event.requestContext?.identity?.sourceIp ||
    "unknown"
  );
}

module.exports = { getIpRange, getClientIp };