const express = require("express");
const router = express.Router();
const redis = require("../config/redis");
const liveEventEmmitterObj = require("events");

const liveEventEmmitter = new liveEventEmmitterObj();

router.get("/live-events/:eventID", (req, res) => {
  const { eventID } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  redis.redisSub.on("message", (channel, message) => {
    if (channel === "live-events") {
      const eventData = JSON.parse(message);
      if (eventData.eventID === eventID) {
        sendEvent(eventData);
      }
    }
  });

  req.on("close", () => {
    liveEventEmmitter.removeListener("live-events", sendEvent);
  });
});

module.exports = router;
