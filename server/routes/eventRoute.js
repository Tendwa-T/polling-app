const express = require("express");
const eventController = require("../controllers/eventController");
const userController = require("../controllers/userController");
const router = express.Router();

router.post("/create", userController.protect, eventController.createEvent);
router.post("/join-event/:eventID", eventController.joinEvent);
router.post("/set-active-question/", eventController.setActiveQuestion);
router.get("/active-question/:eventID", eventController.getActiveQuestion);

module.exports = router;
