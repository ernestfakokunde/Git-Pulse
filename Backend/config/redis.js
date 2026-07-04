const { createClient } = require("redis");

const client = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

client.on("error", (err) => console.log("Redis Client Error", err));

async function connectRedis() {
  try {
    if (process.env.REDIS_URL) {
        await client.connect();
        console.log("Redis connected successfully");
    } else {
        console.log("REDIS_URL not found, skipping Redis connection");
    }
  } catch (error) {
    console.error("Redis connection failed:", error.message);
  }
}

module.exports = { client, connectRedis };
