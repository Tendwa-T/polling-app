const Redis = require("ioredis");

const redis = new Redis();
const subscriber = new Redis();

const redisPub = (channel, message) => {
  redis.publish(channel, JSON.stringify(message), (err, res) => {
    if (err) {
      console.error("Error publishing message:", err);
    } else {
      console.log(`Message published to ${channel}:`, message);
    }
  });
};

const redisSub = (channel, callback) => {
  subscriber.subscribe(channel, (err, count) => {
    if (err) {
      console.error("Error subscribing to channel:", err);
    } else {
      console.log(`Subscribed to channel ${channel}.`);
    }
  });

  subscriber.on("message", (channel, message) => {
    console.log(`Received message from ${channel}:`, message);
    callback(channel, JSON.parse(message));
  });
};
const redisUnsub = (channel) => {
  subscriber.unsubscribe(channel, (err, count) => {
    if (err) {
      console.error("Error unsubscribing from channel:", err);
    } else {
      console.log(`Unsubscribed from channel ${channel}.`);
    }
  });
};
const redisQuit = () => {
  redis.quit();
  subscriber.quit();
};
console.log("Redis connection closed.");

module.exports = {
  redisPub,
  redisSub,
  redisUnsub,
  redisQuit,
};
//
