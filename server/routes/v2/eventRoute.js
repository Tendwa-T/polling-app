const express = require("express");
const {
  createEventV2,
  getEventsV2,
  getEventV2,
  addQuestionToEvent,
} = require("../../controllers/eventController");

const router = express.Router();

router.post("/create", createEventV2);
router.get("/events", getEventsV2);
router.get("/event/:eventUuid", getEventV2);

router.put("/update/question", addQuestionToEvent);

module.exports = router;
