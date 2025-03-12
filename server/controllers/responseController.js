const Response = require("../models/responseModel");
const Event = require("../models/eventModel");

async function submitResposne(req, res) {
  const { userID, eventID, questionID, answer } = req.body;

  try {
    const event = await Event.findById(eventID).populate("questions");
    if (!event) {
      return res
        .status(404)
        .json({ data: null, message: "Event not found", success: false });
    }
    const question = event.questions.find((q) => q._id == questionID);
    if (!question) {
      return res
        .status(404)
        .json({ data: null, message: "Question not found", success: false });
    }

    // find userID in the participants of the event
    const participant = event.participants.find((p) => p.userID == userID);
    if (!participant) {
      return res.status(404).json({
        data: null,
        message: "Participant not part of event",
        success: false,
      });
    }

    // check if the user has already answered the question
    const existingResponse = await Response.findOne({
      userID,
      eventID,
      questionID,
    });
    if (existingResponse) {
      return res.status(400).json({
        data: null,
        message: "Response already submitted",
        success: false,
      });
    }

    const newResponse = await Response.create({
      userID,
      eventID,
      questionID,
      answer,
    });
    if (!newResponse) {
      return res
        .status(400)
        .json({ data: null, message: "Response not saved", success: false });
    }

    let answerCorrect = false;
    if (question.type === "multiple_choice") {
      answerCorrect = question.correctAnswer === answer;
    }
    if (question.type === "rearrange") {
      answerCorrect =
        JSON.stringify(question.correctOrder) === JSON.stringify(answer);
    }
    if (question.type === "rating") {
      answerCorrect = true;
    }
    newResponse.answerCorrect = answerCorrect;
    await newResponse.save();

    return res
      .status(201)
      .json({ data: newResponse, message: "Response Saved", success: true });
  } catch (err) {
    console.log(`Create Response Error: ${err.message}`);
    return res.status(500).json({
      data: null,
      message: `An Error Occured: ${err.message}`,
      success: false,
    });
  }
}
async function getResponses(req, res) {
  const { eventID } = req.params;

  try {
    const responses = await Response.find({ eventID });
    return res
      .status(200)
      .json({ data: responses, message: "Responses Fetched", success: true });
  } catch (err) {
    console.log(`Get Response Error: ${err.message}`);
    return res.status(500).json({
      data: null,
      message: `An Error Occured: ${err.message}`,
      success: false,
    });
  }
}

async function liveResponses(req, res) {
  const { eventID } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  async function sendLiveResults() {
    try {
      const responses = await Response.find({ eventID });
      res.write(`data:${JSON.stringify(responses)}\n\n`);
    } catch (err) {
      console.log(`Error Sending Results: ${err.message}`);
    }
  }
  sendLiveResults();

  const interval = setInterval(sendLiveResults, 2500);
  req.on("close", () => clearInterval(interval));
}

async function analysis(req, res) {
  const { eventID } = req.params;
  try {
    const responses = await Response.find({ eventID }).populate("questionID");
    const questionStats = {};

    responses.forEach(({ questionID, answer }) => {
      if (!questionStats[questionID._id]) {
        questionStats[questionID._id] = {
          question: questionID.text,
          type: questionID.type,
          responses: [],
        };
      }
      questionStats[questionID._id].responses.push(answer);
    });
    return res.status(200).json({
      data: Object.values(questionStats),
      message: "Analysis Complete",
      success: true,
    });
  } catch (err) {
    console.log(`Analysis error: ${err.message}`);
    return res.status(200).json({
      data: Object.values(questionStats),
      message: `An Error Occurred: ${err.message}`,
      success: false,
    });
  }
}

module.exports = {
  submitResposne,
  getResponses,
  liveResponses,
  analysis,
};
