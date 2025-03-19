const { redisPub } = require("../config/redis");
const Event = require("../models/eventModel");
const { v4: uuidv4 } = require("uuid");

async function joinEvent(req, res) {
  const { eventID } = req.params;
  let { userID, userName } = req.body;

  if (!userName)
    return res
      .status(400)
      .json({ data: null, message: "Username is Required", success: false });
  try {
    const event = await Event.findOne({ eventCode: eventID }).populate(
      "activeQuestion"
    );
    if (!event) {
      return res
        .status(404)
        .json({ data: null, message: "Event not found", success: false });
    }
    if (!userID) userID = uuidv4();

    const participant = event.participants.find((p) => p.userName === userName);
    //prevent duplicate usernames
    if (participant) {
      return res.status(400).json({
        data: null,
        message: "Username already exists",
        success: false,
      });
    }
    event.participants.push({ userID, userName });

    await event.save();

    return res.status(200).json({
      data: {
        event: {
          eventID: event._id,
          eventCode: event.eventCode,
          eventName: event.name,
          eventDescription: event.description,
          eventStartTime: event.startTime,
          eventEndTime: event.endTime,
        },
        userID,
        userName,
        activeQuestion: event.activeQuestion,
      },
      message: "Event Joined Successfully",
      success: true,
    });
  } catch (err) {
    console.log(`Join Event Error: ${err.message}`);
    return res.status(500).json({
      data: null,
      message: `An Error Occurred: ${err.message}`,
      success: false,
    });
  }
}
async function setActiveQuestion(req, res) {
  const { eventID, questionID, isLastQuestion } = req.body;

  try {
    const event = await Event.findByIdAndUpdate(
      eventID,
      {
        activeQuestion: questionID,
        isLastQuestion,
      },
      { new: true }
    );
    if (!event)
      return res
        .status(404)
        .json({ data: null, message: "Event not found", success: false });

    const resEvent = await Event.findById(eventID).populate("activeQuestion");

    redisPub.publish(
      "live-events",
      JSON.stringify({
        eventCode: event.eventCode,
        activeQuestion: resEvent.activeQuestion,
        isLastQuestion: resEvent.isLastQuestion,
      })
    );

    return res
      .status(200)
      .json({ data: null, message: "Active question updated", success: true });
  } catch (err) {
    console.log(`Set Active Question Error: ${err.message}`);
    return res.status(500).json({
      data: null,
      message: `An Error Occurred: ${err.message}`,
      success: false,
    });
  }
}
async function getActiveQuestion(req, res) {
  const { eventID } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  async function sendQuestionUpdate() {
    const event = await Event.findById(eventID).populate("activeQuestion");
    res.write(
      `data: ${JSON.stringify({
        activeQuestion: event.activeQuestion,
        isLastQuestion: event.isLastQuestion,
      })}\n\n`
    );
  }
  sendQuestionUpdate();

  const interval = setInterval(sendQuestionUpdate, 5000);
  req.on("close", () => {
    clearInterval(interval);
  });
}

async function resetActiveQuestion(req, res) {
  const { eventID } = req.params;

  try {
    const event = await Event.findById(eventID);
    if (!event)
      return res
        .status(404)
        .json({ data: null, message: "Event not found", success: false });
    event.activeQuestion = null;
    event.isLastQuestion = false;
    await event.save();

    return res
      .status(200)
      .json({ data: null, message: "Active question reset", success: true });
  } catch (err) {
    console.log(`Reset Active Question Error: ${err.message}`);
    return res.status(500).json({
      data: null,
      message: `An Error Occurred: ${err.message}`,
      success: false,
    });
  }
}

async function createEvent(req, res) {
  try {
    const { name, description, adminID } = req.body;
    const eventCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 1);

    const newEvent = await Event.create({
      name,
      eventCode,
      adminID,
      description,
      endTime: endDate,
    });
    if (!newEvent) {
      return res
        .status(400)
        .json({ data: null, message: "Event not saved", success: false });
    }

    return res.status(201).json({
      data: { eventID: newEvent._id, eventCode },
      message: "Event Created",
      success: true,
    });
  } catch (err) {
    console.log("Create Event Error:", err.message);
    return res.status(500).json({
      data: null,
      message: `An error occurred: ${err.message}`,
      success: false,
    });
  }
}

async function startEvent(req, res) {
  try {
    const { eventID } = req.params;
    const event = await Event.findByIdAndUpdate(
      eventID,
      { status: "live" },
      { new: true }
    );
    if (!event) {
      return res
        .status(404)
        .json({ data: null, message: "Event not found", success: false });
    }
    return res.status(200).json({
      data: null,
      message: "Event Started",
      success: true,
    });
  } catch (err) {}
}

async function endEvent(req, res) {
  try {
    const { eventID } = req.params;
    const event = await Event.findByIdAndUpdate(eventID, {
      status: "completed",
    });
    if (!event) {
      return res
        .status(404)
        .json({ data: null, message: "Event not found", success: false });
    }
    redisPub.publish(
      "live-events",
      JSON.stringify({
        eventCode: event.eventCode,
        eventEnded: true,
      })
    );
    return res.status(200).json({
      data: null,
      message: "Event Ended",
      success: true,
    });
  } catch (err) {
    console.log("End Event Error:", err.message);
    return res.status(500).json({
      data: null,
      message: `An error occurred: ${err.message}`,
      success: false,
    });
  }
}

module.exports = {
  joinEvent,
  setActiveQuestion,
  getActiveQuestion,
  createEvent,
  resetActiveQuestion,
  startEvent,
  endEvent,
};
