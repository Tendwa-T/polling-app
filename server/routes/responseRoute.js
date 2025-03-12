const express = require("express");
const responseController = require("../controllers/responseController");
const userController = require("../controllers/userController");
const router = express.Router();

router.post("/submit-response", responseController.submitResposne);
router.get("/:eventID", responseController.getResponses);
router.get(
  "/live-responses/:eventID",
  userController.protect,
  responseController.liveResponses
);
router.get("/analysis/:eventID", responseController.analysis);

module.exports = router;
