const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const logger = require("morgan");

const passport = require("passport");
const users = require("./routes/api/users");

const data = require("./routes/api/data");
const app = express();
app.use(cors());

const dotenv = require("dotenv");
dotenv.config();
const { API_PORT, DB_USERNAME, DB_PASSWORD } = process.env;

/* Socket.io */
const mySocket = require("./mySocket");
const timerSocket = require("./timerSocket");
mySocket.setup(8000);
timerSocket.setup(8001);

const RTCSocket = require("./RTCSocket");

// this is our MongoDB database
const dbRoute = "mongodb+srv://";
DB_USERNAME +
  ":" +
  DB_PASSWORD +
  "@practice-nmjo9.azure.mongodb.net/test?retryWrites=true";

// connects our back end code with the database
mongoose.connect(
  dbRoute,
  { dbName: "convo" }
);

let db = mongoose.connection;

db.once("open", () => console.log("connected to the database"));

// checks if connection with the database is successful
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// (optional) only made for logging and
// bodyParser, parses the request body to be a readable json format
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger("dev"));

// Passport middleware
app.use(passport.initialize());
// Passport config
require("./config/passport")(passport);
// Routes
app.use("/api/users", users);

// append /api for our http requests
app.use("/api/data", data);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
