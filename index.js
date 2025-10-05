const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const bodyParser = require("body-parser");
const mongoose = require("mongoose");

// connect to db
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// create schema
const Schema = mongoose.Schema;

const exerciseSchema = new Schema({
  // username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, required: true }, // type Date?
});

const userSchema = new Schema({
  username: { type: String, required: true },
});

const logSchema = new Schema({
  username: { type: String, required: true },
  count: { type: Number, required: true },
  log: [exerciseSchema], // subdoc, type subSchema?
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);
const Log = mongoose.model("Log", logSchema);

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

// Create User
const createUser = async (username) => {
  try {
    const user = new User({ username });
    const newUser = await user.save(); // save to db
    console.log("User saved: ", newUser);
    return newUser;
  } catch (err) {
    console.log("Error saving user", err);
    throw err;
  }
};

// Create exercise
const createExercise = async (exerciseFields) => {
  try {
    console.log("reached1");
    const exercise = new Exercise({ exerciseFields });
    console.log("reached2");
    const newExercise = await exercise.save();
    console.log("reached3");
  } catch (err) {
    console.log("Error saving exercise", err);
    throw err;
  }
};

// Create log
const createLog = async (logFields) => {
  try {
    const log = new Log({ logFields });
  } catch (err) {
    console.log("Error saving log", err);
    throw err;
  }
};

const findUser = async (username) => {
  try {
    const userFound = await User.findOne({ username });
    return userFound ? userFound : null;
  } catch (err) {
    console.log("Error finding user", err);
    throw err;
  }
};

const findUserbyId = async (_id) => {
  try {
    const userFound = await User.findById({ _id });
    return userFound ? userFound.username : null;
  } catch (err) {
    console.log("Error finding user", err);
    throw err;
  }
};

app.use(bodyParser.urlencoded({ extended: true }));

app.post("/api/users", async (req, res) => {
  const username = req.body.username;
  console.log(username);
  try {
    // IS IT NECESSARY TO CHECK OR DOES MONGO AUTO CHECK BEFORE CREATE
    // check if user already exists
    let user = await findUser(username);
    console.log("User found: ", user);
    // create if user is new
    if (!user) {
      user = await createUser(username);
      // user = newUser
      console.log("User created: ", user);
    }
    // return the user
    return res.json({ username: user.username, _id: user._id });
  } catch (err) {
    console.error("Error in POST /api/users", err);
    res.status(500).json({ error: "invalid url" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error("Error in GET /api/users", err);
    res.status(500).json({ error: "Cannot get users" });
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const _id = req.params._id;
  console.log(_id);
  try {
    const username = await findUserbyId(_id);
    console.log("Username found:", username);

    if (username) {
      const description = req.body.description;
      const duration = req.body.duration;
      let d = new Date(req.body.date); // convert date
      if (isNaN(d)) {
        d = new Date(); // date today if none given
      }
      const date = d.toDateString();

      const exerciseFields = { description, duration, date };
      console.log("Exercise fields created", exerciseFields);
      const exercise = await createExercise(exerciseFields);
      console.log("Exercise created", exercise);

      // const cnt = findLog()
      // const count = count + 1
      // const logFields = {username, count, _id, log: exercise}
      // const log = await createLog(exerciseFields);
    }
  } catch (err) {
    console.log("Error in POST /api/users/:_id/exercises", err);
    res.status(500).json({ error: "Cannot add exercise" });
  }
});
