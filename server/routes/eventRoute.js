const express = require("express");
const eventController = require("../controllers/eventController");
const userController = require("../controllers/userController");
const redis = require("../config/redis");
const liveEventEmmitterObj = require("events");
const liveEventEmmitter = new liveEventEmmitterObj();
const router = express.Router();

router.post("/create", userController.protect, eventController.createEvent);
router.post("/join-event/:eventID", eventController.joinEvent);
router.post("/set-active-question/", eventController.setActiveQuestion);
router.get("/active-question/:eventID", eventController.getActiveQuestion);
router.get(
  "/reset-active-question/:eventID",
  eventController.resetActiveQuestion
);
router.get("/live-event/:eventID", (req, res) => {
  const { eventID } = req.params;
  console.log("Live Event Route Hit");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  console.log("Headers Set");

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  redis.redisSub.on("message", (channel, message) => {
    if (channel === "live-events") {
      const eventData = JSON.parse(message);
      sendEvent(eventData);
    }
  });

  req.on("close", () => {
    liveEventEmmitter.removeListener("live-events", sendEvent);
  });
});

router.get("/end-event/:eventID", eventController.endEvent);

module.exports = router;
