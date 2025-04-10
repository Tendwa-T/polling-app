const mongoose = require("mongoose");

/**
 * TODO: V2 Implementation
 * 1. Adjust the response schema with the following fields:
 *   - userID: string
 *   - eventID: ObjectID -> UUID
 *   - questionID: ObjectID -> UUID
 *   - answer -> options: UUID, ref: "options"
 *   - answerCorrect: boolean
 *   - submittedAt: Date
 */

const responseSchema = new mongoose.Schema({
  userID: { type: String, required: true },
  eventID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  questionID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  answer: { type: mongoose.Schema.Types.Mixed, required: true },
  answerCorrect: { type: Boolean, default: false },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Response", responseSchema);
