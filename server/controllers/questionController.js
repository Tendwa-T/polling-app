const Question = require("../models/questionModel");
const Event = require("../models/eventModel");

async function createQuestion(req, res) {
  const {
    type,
    eventID,
    text,
    choices,
    correctAnswer,
    correctOrder,
    maxRating,
  } = req.body;

  if (!eventID) {
    return res.status(400).json({
      data: null,
      message: "Event ID is required",
      success: false,
    });
  }
  if (!type) {
    return res.status(400).json({
      data: null,
      message: "Question type is required",
      success: false,
    });
  }
  if (!text) {
    return res.status(400).json({
      data: null,
      message: "Question text is required",
      success: false,
    });
  }
  if (type === "multiple_choice" && (!choices || choices.length < 2)) {
    return res.status(400).json({
      data: null,
      message: "Choices are required for multiple choice questions",
      success: false,
    });
  }
  if (type === "multiple_choice" && !correctAnswer) {
    return res.status(400).json({
      data: null,
      message: "Correct answer is required for multiple choice questions",
      success: false,
    });
  }
  if (type === "rearrange" && (!correctOrder || correctOrder.length < 2)) {
    return res.status(400).json({
      data: null,
      message: "Correct order is required for rearrange questions",
      success: false,
    });
  }
  if (type === "rating" && !maxRating) {
    return res.status(400).json({
      data: null,
      message: "Max rating is required for rating questions",
      success: false,
    });
  }
  try {
    const newQuestion = await Question.create({
      type,
      text,
      choices,
      correctAnswer,
      correctOrder,
      maxRating,
    });
    if (!newQuestion) {
      return res
        .status(400)
        .json({ data: null, message: "Question not created", success: false });
    }
    await Event.findByIdAndUpdate(eventID, {
      $push: { questions: newQuestion._id },
    });
    return res.status(201).json({
      data: newQuestion,
      message: "Question created",
      success: true,
    });
  } catch (err) {
    console.log(`Create Question Error: ${err.message}`);
    return res.status(500).json({
      data: null,
      message: `An Error Occurred: ${err.message}`,
      success: false,
    });
  }
}
async function getQuestions(req, res) {
  const { eventID } = req.params;
  try {
    const event = await Event.findById(eventID).populate("questions");
    return res.status(200).json({
      data: event.questions,
      message: "Questions fetched",
      success: true,
    });
  } catch (err) {
    console.log(`Get Question Error: ${err.message}`);
    return res.status(500).json({
      data: null,
      message: `An Error Occurred: ${err.message}`,
      success: false,
    });
  }
}

module.exports = {
  createQuestion,
  getQuestions,
};
