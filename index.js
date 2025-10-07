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

const userSchema = new Schema({
  username: { type: String, required: true },
});

const exerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true },
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

const createUser = async (username) => {
  try {
    const user = new User({ username });
    const newUser = await user.save(); // save to db
    return newUser;
  } catch (err) {
    console.log("Error saving user", err);
    throw err;
  }
};

const createExercise = async (exerciseFields) => {
  try {
    const exercise = new Exercise(exerciseFields);
    const newExercise = await exercise.save();
    return newExercise;
  } catch (err) {
    console.log("Error saving exercise", err);
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

const findExercisesByFilter = async (filter, limit) => {
  try {
    const exercises = await Exercise.find(filter).limit(+limit || 0);
    return exercises;
  } catch (err) {
    console.log("Error finding exercise", err);
    throw err;
  }
};

app.use(bodyParser.urlencoded({ extended: true }));

app.post("/api/users", async (req, res) => {
  const username = req.body.username;
  try {
    let user = await findUser(username);
    // create if user is new
    if (!user) {
      user = await createUser(username);
    }
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
  try {
    const username = await findUserbyId(_id);

    if (username) {
      const { description, duration, date } = req.body;

      const exercise = await createExercise({
        userId: _id,
        description,
        duration,
        date: date ? new Date(date) : new Date(),
      });

      res.json({
        username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
        _id,
      });
    }
  } catch (err) {
    console.log("Error in POST /api/users/:_id/exercises", err);
    res.status(500).json({ error: "Cannot add exercise" });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  const filter = { userId };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  try {
    const username = await findUserbyId(userId);
    // const count = await Exercise.countDocuments({ userId });
    // const exercises = await Exercise.find(filter).limit(+limit || 0);
    const exercises = await findExercisesByFilter(filter, limit);

    res.json({
      username,
      // count,
      count: exercises.length,
      _id: userId,
      // log: exercises,
      log: exercises.map((ex) => ({
        description: ex.description,
        duration: ex.duration,
        date: ex.date.toDateString(),
      })),
    });
  } catch (err) {
    console.log("Error in GET /api/users/:_id/logs", err);
    res.status(500).json({ error: "Cannot get logs" });
  }
});
