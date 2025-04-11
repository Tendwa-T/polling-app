require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const chalk = require("chalk");

const PORT = process.env.PORT || 5000;

const app = express();

//Routes v1
const eventRoute = require("./routes/eventRoute");
const responseRoute = require("./routes/responseRoute");
const resultRoute = require("./routes/resultRoute");
const questionRoute = require("./routes/questionRoute");
const userRouter = require("./routes/userRoute");

//Routes v2
const eventRouteV2 = require("./routes/v2/eventRoute");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.get("/", (req, res) => {
  return res.json({ message: "API ONLINE" });
});
// console to the log the route that has been hit and pass on to the next middleware
// Add Color using chalk to the various aspects being logged
app.use((req, res, next) => {
  const method = chalk.default.blue(req.method);
  const url = chalk.default.green(req.url);
  const time = chalk.default.yellow(new Date().toLocaleString());
  const ip = chalk.default.cyan(req.ip);
  const userAgent = chalk.default.magenta(req.headers["user-agent"]);
  const status = chalk.default.white(res.statusCode);

  console.log(`[${time}] ${method} ${status} ${url} ${ip} ${userAgent}`);
  next();
});
app.use("/api/v1/events", eventRoute);
app.use("/api/v1/responses", responseRoute);
app.use("/api/v1/results", resultRoute);
app.use("/api/v1/questions", questionRoute);
app.use("/api/v1/users", userRouter);

app.use("/api/v2/events", eventRouteV2);

app.listen(PORT, () => {
  console.log(`Server is listening on PORT: ${PORT}`);
});
