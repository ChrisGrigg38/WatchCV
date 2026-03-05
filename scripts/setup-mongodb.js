require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { MongoClient } = require("mongodb");

async function setup() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || "watchcv";

  if (!uri) {
    console.error("ERROR: MONGODB_URI is not set in .env");
    process.exit(1);
  }

  console.log(`Connecting to MongoDB...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    // Create collections with validators
    const collections = await db.listCollections().toArray();
    const names = collections.map((c) => c.name);

    if (!names.includes("trackingid")) {
      await db.createCollection("trackingid");
      console.log("Created collection: trackingid");
    }

    if (!names.includes("trackingEvents")) {
      await db.createCollection("trackingEvents");
      console.log("Created collection: trackingEvents");
    }

    // Create indexes
    const trackingId = db.collection("trackingid");
    await trackingId.createIndex({ trackingId: 1 }, { unique: true });
    await trackingId.createIndex({ ipAddress: 1 });
    await trackingId.createIndex({ ipRangeStart: 1, ipRangeEnd: 1 });
    await trackingId.createIndex({ createdAt: 1 });
    await trackingId.createIndex({ lastUpdatedAt: 1 });
    console.log("Created indexes for trackingid");

    const trackingEvents = db.collection("trackingEvents");
    await trackingEvents.createIndex({ eventId: 1 }, { unique: true });
    await trackingEvents.createIndex({ trackingId: 1 });
    await trackingEvents.createIndex({ createdAt: 1 });
    await trackingEvents.createIndex({ lastUpdatedAt: 1 });
    console.log("Created indexes for trackingEvents");

    console.log("\n✅ MongoDB setup complete!");
    console.log(`Database: ${dbName}`);
  } catch (err) {
    console.error("Setup failed:", err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

setup();