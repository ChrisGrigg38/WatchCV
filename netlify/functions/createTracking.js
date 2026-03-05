const { v4: uuidv4 } = require("uuid");
const { connectToDatabase } = require("./utils/mongodb");
const { getIpRange, getClientIp } = require("./utils/ipUtils");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("trackingid");

    const ipCooldownMinutes = parseInt(process.env.IP_RANGE_COOLDOWN_MINUTES || "60");
    const maxPerHour = parseInt(process.env.MAX_TRACKINGS_PER_HOUR || "100");

    const clientIp = getClientIp(event);
    const { start: ipRangeStart, end: ipRangeEnd } = getIpRange(clientIp);
    const now = new Date();
    const cooldownCutoff = new Date(now.getTime() - ipCooldownMinutes * 60 * 1000);
    const hourCutoff = new Date(now.getTime() - 60 * 60 * 1000);

    // Check IP range cooldown
    const recentByRange = await collection.findOne({
      ipRangeStart,
      ipRangeEnd,
      createdAt: { $gte: cooldownCutoff },
    });

    if (recentByRange) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          error: "A tracking was recently created from your IP range. Please wait before creating another.",
          retryAfterMinutes: ipCooldownMinutes,
        }),
      };
    }

    // Check global hourly limit
    const recentCount = await collection.countDocuments({
      createdAt: { $gte: hourCutoff },
    });

    if (recentCount >= maxPerHour) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          error: "Global tracking creation limit reached. Please try again later.",
        }),
      };
    }

    // Create new tracking
    const trackingId = uuidv4();
    const doc = {
      trackingId,
      ipAddress: clientIp,
      ipRangeStart,
      ipRangeEnd,
      createdAt: now,
      lastUpdatedAt: now,
    };

    await collection.insertOne(doc);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ trackingId }),
    };
  } catch (err) {
    console.error("createTracking error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};