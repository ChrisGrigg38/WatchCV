const { v4: uuidv4 } = require("uuid");
const { connectToDatabase } = require("./utils/mongodb");
const { getClientIp } = require("./utils/ipUtils");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/vnd.fdf",
  "Content-disposition": "inline"
};

exports.handler = async (event) => {

  // Minimum required FDF structure (empty)
  const emptyFdf = "%FDF-1.2\n%âãÏÓ\n1 0 obj\n<< /FDF << >> >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF";
  //%FDF-1.2\n%âãÏÓ\n1 0 obj\n<< /FDF << >> >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF
  
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // Support both POST (XHR) and GET (app.launchURL fallback)
  let trackingId;
  if (event.httpMethod === "POST") {
    trackingId = event.queryStringParameters?.trackingId;
  } else if (event.httpMethod === "GET") {
    trackingId = event.queryStringParameters?.trackingId;
  } else {
    return { statusCode: 405, headers, body: "Method not allowed" };
  }

  if (!trackingId) {
    return { statusCode: 400, headers, body: "trackingId is required" };
  }

  //You might be wondering why we alsways return http status code 200 on failures below, it's because if it isn't a 200 acrobat will complain
  //after a submitForm has occured on the PDF and you'll get an error popup message in acrobat. I'd rather it to fail silently so they don't know tracking was used..
  try {
    const { db } = await connectToDatabase();
    const trackingCol = db.collection("trackingid");
    const eventsCol = db.collection("trackingEvents");

    const cooldownSeconds = parseInt(process.env.ADD_TRACKING_COOLDOWN_SECONDS || "30");
    const now = new Date();

    const tracking = await trackingCol.findOne({ trackingId });
    if (!tracking) {
      return { statusCode: 200, headers, body: emptyFdf, isBase64Encoded: false };
    }

    const cooldownCutoff = new Date(now.getTime() - cooldownSeconds * 1000);
    if (tracking.lastUpdatedAt && tracking.lastUpdatedAt > cooldownCutoff && tracking.lastUpdatedAt > tracking.createdAt) {
      return {
        statusCode: 200, headers, body: emptyFdf, isBase64Encoded: false
      };
    }

    const eventId = uuidv4();

    await eventsCol.insertOne({
      eventId,
      trackingId,
      ipAddress: null, //we don't store the ip address now due to privacy and legal concerns
      createdAt: now,
      lastUpdatedAt: now,
    });

    await trackingCol.updateOne(
      { trackingId },
      { $set: { lastUpdatedAt: now } }
    );

    return {
      statusCode: 200, headers, body: emptyFdf, isBase64Encoded: false
    };
  } catch (err) {
    console.error("addTracking error:", err);
    return {
      statusCode: 200, headers, body: emptyFdf, isBase64Encoded: false
    };
  }
};