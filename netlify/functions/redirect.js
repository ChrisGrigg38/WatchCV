const { connectToDatabase } = require("./utils/mongodb");
const { getClientIp } = require("./utils/ipUtils");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

exports.handler = async (event) => {
  const { trackingId, url } = event.queryStringParameters || {};

  // Always redirect even if tracking fails — never leave the user hanging
  const safeRedirect = (destination) => ({
    statusCode: 302,
    headers: { Location: destination },
    body: "",
  });

  if (!url) {
    return { statusCode: 400, body: "Missing url parameter" };
  }

  // Decode and validate the destination URL
  let destination;
  try {
    destination = decodeURIComponent(url);
    new URL(destination); // will throw if invalid
  } catch {
    return { statusCode: 400, body: "Invalid url parameter" };
  }

  if (!trackingId) {
    return safeRedirect(destination);
  }

  try {
    const { db } = await connectToDatabase();
    const trackingCol = db.collection("trackingid");
    const eventsCol = db.collection("trackingEvents");

    const cooldownSeconds = parseInt(process.env.ADD_TRACKING_COOLDOWN_SECONDS || "30");
    const now = new Date();

    const tracking = await trackingCol.findOne({ trackingId });

    if (tracking) {
      const cooldownCutoff = new Date(now.getTime() - cooldownSeconds * 1000);
      const tooSoon = tracking.lastUpdatedAt && tracking.lastUpdatedAt > cooldownCutoff;

      if (!tooSoon) {
        const eventId = uuidv4();

        await eventsCol.insertOne({
          eventId,
          trackingId,
          ipAddress: null, //not storing ip address for now.
          createdAt: now,
          lastUpdatedAt: now,
        });

        await trackingCol.updateOne(
          { trackingId },
          { $set: { lastUpdatedAt: now } }
        );
      }
    }
  } catch (err) {
    console.error("redirect tracking error:", err);
    // Still redirect even if DB write fails
  }

  return safeRedirect(destination);
};