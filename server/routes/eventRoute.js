const express = require("express");
const eventController = require("../controllers/eventController");
const userController = require("../controllers/userController");
const liveEventEmmitterObj = require("events");
const { redisPub, redisSub } = require("../config/redis");
const liveEventEmmitter = new liveEventEmmitterObj();
const router = express.Router();

router.post("/create", userController.protect, eventController.createEvent);

router.get("/event/:eventID", userController.protect, eventController.getEvent);

router.get(
  "/events/:adminID",
  userController.protect,
  eventController.getEvents
);

router.post("/join-event/:eventID", eventController.joinEvent);
router.post(
  "/set-active-question/",
  userController.protect,
  eventController.setActiveQuestion
);
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

  //check for a message on the channel
  redisSub(`live-event-${eventID}`, (channel, message) => {
    console.log("Message Received");
    const data = JSON.parse(message);
    sendEvent(data);
  });

  req.on("close", () => {
    liveEventEmmitter.removeListener(`live-event-${eventID}`, sendEvent);
  });
});

router.get(
  "/start-event/:eventID",
  userController.protect,
  eventController.startEvent
);

router.get(
  "/end-event/:eventID",
  userController.protect,
  eventController.endEvent
);

module.exports = router;
