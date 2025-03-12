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
  participants: [
    {
      userID: { type: String, required: true },
      userName: { type: String, required: true },
    },
  ],
});

module.exports = mongoose.model("Event", eventSchema);
