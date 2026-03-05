exports.config = {
  schedule: "@daily"
};

const { connectToDatabase } = require("./utils/mongodb");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
    
  // Accepts GET or POST — meant to be called by a Netlify scheduled function or cron
  try {
    const { db } = await connectToDatabase();
    const trackingCol = db.collection("trackingid");
    const eventsCol = db.collection("trackingEvents");

    const staleDays = parseInt(process.env.STALE_DATA_DAYS || "30");
    const cutoff = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000);

    // Find stale trackingIds
    const staleTrackings = await trackingCol
      .find({ lastUpdatedAt: { $lt: cutoff } })
      .toArray();

    if (staleTrackings.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ removed: 0, message: "No stale trackings found" }),
      };
    }

    const staleIds = staleTrackings.map((t) => t.trackingId);

    // Remove events
    const eventsResult = await eventsCol.deleteMany({ trackingId: { $in: staleIds } });

    // Remove trackingIds
    const trackingResult = await trackingCol.deleteMany({ trackingId: { $in: staleIds } });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        removed: trackingResult.deletedCount,
        eventsRemoved: eventsResult.deletedCount,
        message: `Removed ${trackingResult.deletedCount} stale trackings and ${eventsResult.deletedCount} events`,
      }),
    };
  } catch (err) {
    console.error("removeStaleTrackings error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};