const { connectToDatabase } = require("./utils/mongodb");

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
    const body = JSON.parse(event.body || "{}");
    const { trackingId, eventId } = body;

    if (!trackingId || !eventId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "trackingId and eventId are required" }) };
    }

    const { db } = await connectToDatabase();
    const eventsCol = db.collection("trackingEvents");

    const now = new Date();
    const result = await eventsCol.updateOne(
      { eventId, trackingId },
      { $set: { lastUpdatedAt: now } }
    );

    if (result.matchedCount === 0) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: "Tracking event not found" }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("updateTracking error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};