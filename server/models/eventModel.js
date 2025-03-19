const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  eventCode: {
    type: String,
    required: true,
  },
  adminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  description: { type: String },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
    },
  ],
  activeQuestion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
  },
  isLastQuestion: { type: Boolean, default: false },
  participants: [
    {
      userID: { type: String, required: true },
      userName: { type: String, required: true },
    },
  ],
  status: {
    type: String,
    enum: ["pending", "live", "completed"],
    default: "pending",
  },
});

module.exports = mongoose.model("Event", eventSchema);
