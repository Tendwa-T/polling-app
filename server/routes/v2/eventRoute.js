const express = require("express");
const {
  createEventV2,
  getEventsV2,
  getEventV2,
  addQuestionToEvent,
  setActiveQuestionV2,
  joinEventV2,
  voteV2,
  correctOptionV2,
  resetVotesV2,
} = require("../../controllers/eventController");
const { redisSub } = require("../../config/redis");
const liveEventEmmitterObj = require("events");
const liveEventEmmitter = new liveEventEmmitterObj();

const router = express.Router();

router.post("/create", createEventV2);
router.get("/events", getEventsV2);
router.get("/event/:eventUuid", getEventV2);

router.put("/update/question", addQuestionToEvent);
router.put("/set-active-question", setActiveQuestionV2);
router.put("/join-event/:eventUuid", joinEventV2);

router.post("/event/reveal", correctOptionV2);
router.get("/event/reset/:eventUuid", resetVotesV2);

router.post("/vote", voteV2);

router.get("/live-event/:eventUuid", (req, res) => {
  const { eventUuid } = req.params;
  console.log("Live Event Route Hit");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  console.log("Headers Set");

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  //check for a message on the channel
  redisSub(`live-event-${eventUuid}`, (channel, message) => {
    console.log("Message Received");
    const data = JSON.parse(message);
    sendEvent(data);
  });

  req.on("close", () => {
    liveEventEmmitter.removeListener(`live-event-${eventUuid}`, sendEvent);
  });
});

module.exports = router;
