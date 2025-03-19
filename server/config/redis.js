const Redis = require("ioredis");

const redisPub = new Redis();
const redisSub = new Redis();

redisSub.on("connect", () => console.log("✅ Connected to Redis"));
redisPub.on("error", (err) => console.log("❌ Redis Pub error", err));
redisSub.on("error", (err) => console.log("❌ Redis Sub Error", err));

redisSub.subscribe("live-events");

module.exports = { redisPub, redisSub };
