const { default: mongoose } = require("mongoose");
const Event = require("../models/eventModel");
const Response = require("../models/responseModel");
const { ObjectId } = require("mongoose").Types;

async function getEventResults(req, res) {
  try {
    const { eventID } = req.params;
    const event = await Event.findById(eventID).populate("questions");
    if (!event) {
      return res.status(404).json({
        data: null,
        message: "Event not found",
        success: false,
      });
    }
    const totalParticipants = await Response.distinct("userID", {
      eventID,
    }).countDocuments();
    const totalQuestions = event.questions.length;
    let analysis = {
      eventName: event.name,
      date: event.startTime,
      totalParticipants,
      totalQuestions,
      questions: [],
      participantBreakdown: [],
    };

    for (const q of event.questions) {
      let qData = {
        questionID: q._id,
        text: q.text,
        type: q.type,
      };

      if (q.type === "multiple_choice") {
        const responses = await Response.find({ questionID: q._id, eventID });
        let optionCounts = [];
        let correctCount = 0;

        responses.forEach((res) => {
          //ensure that every option that is in q.choices is included in the response
          q.choices.forEach((choice) => {
            if (!optionCounts.find((opt) => opt.option === choice)) {
              optionCounts.push({ option: choice, count: 0 });
            }
          });
          //increment the count of the option selected by the user
          optionCounts.find((opt) => opt.option === res.answer).count++;
          //increment the correct count if the user's answer is correct
          if (res.answer === q.correctAnswer) {
            correctCount++;
          }
        });

        qData.stats = {
          totalVotes: responses.length,
          options: optionCounts,
          correctAnswer: q.correctAnswer,
          correctPercentage: (correctCount / responses.length) * 100 || 0,
        };
      } else if (q.type === "rearrange") {
        const responses = await Response.find({ questionID: q._id, eventID });
        let correctCount = 0;
        let commonMistakes = {};

        responses.forEach((res) => {
          if (JSON.stringify(res.answer) === JSON.stringify(q.correctOrder)) {
            correctCount++;
          } else {
            let key = res.answer.join(" -> ");
            commonMistakes[key] = (commonMistakes[key] || 0) + 1;
          }
        });

        qData.stats = {
          totalResponses: responses.length,
          correctPercentage: (correctCount / responses.length) * 100 || 0,
          mostCommonMistakes:
            Object.entries(commonMistakes).sort((a, b) => b[1] - a[1])[0] ||
            "N/A",
        };
      } else if (q.type === "rating") {
        const responses = await Response.find({ questionID: q._id, eventID });
        let ratingCounts = {};
        let totalRating = 0;

        responses.forEach((res) => {
          totalRating += res.answer;
          ratingCounts[res.answer] = (ratingCounts[res.answer] || 0) + 1;
        });

        qData.stats = {
          totalResponses: responses.length,
          averageRating: totalRating / responses.length || 0,
          distribution: ratingCounts,
        };
      }
      analysis.questions.push(qData);
    }

    const eventIDMon = new mongoose.Types.ObjectId(eventID);

    const participantResponses = await Event.aggregate([
      { $match: { _id: eventIDMon } },
      { $unwind: "$participants" },
      {
        $group: {
          _id: "$participants.userID",
          userName: { $first: "$participants.userName" },
          answered: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          userID: "$_id",
          userName: 1,
          answered: "$answered",
        },
      },
    ]);

    analysis.participantBreakdown = participantResponses.map((user) => {
      // ensure the username is also included in the response
      return {
        userID: user.userID,
        userName: user.userName,
        answered: user.answered,
      };
    });

    return res.status(200).json({
      data: analysis,
      message: "Event Analysis",
      success: true,
    });
  } catch (err) {
    console.log(`Get Event Results Error: ${err.message}`);
    return res.status(500).json({
      data: null,
      message: `An Error Occurred: ${err.message}`,
      success: false,
    });
  }
}

async function getTopScorer(req, res) {
  const { eventID } = req.params;
  try {
    const eventIDMon = new mongoose.Types.ObjectId(eventID);
    const topScorer = await Response.aggregate([
      { $match: { eventID: eventIDMon } },
      {
        $lookup: {
          from: "questions",
          localField: "questionID",
          foreignField: "_id",
          as: "question",
        },
      },
      { $unwind: "$question" },
      {
        $match: {
          $expr: { $eq: ["$answer", "$question.correctAnswer"] },
        },
      },
      // Look up the ID in the event participants array
      {
        $lookup: {
          from: "events",
          localField: "eventID",
          foreignField: "_id",
          as: "event",
        },
      },
      { $unwind: "$event" },
      { $unwind: "$event.participants" },
      {
        $match: {
          $expr: { $eq: ["$userID", "$event.participants.userID"] },
        },
      },
      {
        $project: {
          userID: 1,
          userName: "$event.participants.userName",
        },
      },
      {
        $group: {
          _id: "$userID",
          userName: { $first: "$userName" },
          score: { $sum: 1 },
        },
      },
      { $sort: { score: -1 } },

      {
        $project: {
          _id: 0,
          userID: "$_id",
          userName: 1,
          score: 1,
        },
      },
    ]);

    return res.status(200).json({
      data: topScorer,
      message: "Top Scorer",
      success: true,
    });
  } catch (err) {
    console.log(`Get Top Scorer Error: ${err.message}`);
    return res.status(500).json({
      data: null,
      message: `An Error Occurred: ${err.message}`,
      success: false,
    });
  }
}

module.exports = { getEventResults, getTopScorer };
