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
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const trackingId = event.queryStringParameters?.trackingId;

    if (!trackingId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "trackingId query param is required" }) };
    }

    const { db } = await connectToDatabase();
    const trackingCol = db.collection("trackingid");
    const eventsCol = db.collection("trackingEvents");

    const tracking = await trackingCol.findOne({ trackingId });
    if (!tracking) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: "Tracking not found" }) };
    }

    const events = await eventsCol
      .find({ trackingId })
      .sort({ createdAt: 1 })
      .toArray();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        tracking: {
          trackingId: tracking.trackingId,
          createdAt: tracking.createdAt,
          lastUpdatedAt: tracking.lastUpdatedAt,
        },
        events: events.map((e) => ({
          eventId: e.eventId,
          trackingId: e.trackingId,
          ipAddress: e.ipAddress,
          createdAt: e.createdAt,
          lastUpdatedAt: e.lastUpdatedAt,
        })),
      }),
    };
  } catch (err) {
    console.error("getTracking error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};