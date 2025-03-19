require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const app = express();

//Routes
const eventRoute = require("./routes/eventRoute");
const responseRoute = require("./routes/responseRoute");
const resultRoute = require("./routes/resultRoute");
const questionRoute = require("./routes/questionRoute");
const userRouter = require("./routes/userRoute");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.get("/", (req, res) => {
  return res.json({ message: "API ONLINE" });
});
// console to the log the route that has been hit and pass on to the next middleware
app.use((req, res, next) => {
  console.log(`Route: ${req.url}`);
  next();
});
app.use("/api/v1/events", eventRoute);
app.use("/api/v1/responses", responseRoute);
app.use("/api/v1/results", resultRoute);
app.use("/api/v1/questions", questionRoute);
app.use("/api/v1/users", userRouter);

app.listen(PORT, () => {
  console.log(`Server is listening on PORT: ${PORT}`);
});
