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
  date: { type: Date, required: true }, // type string?
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
    console.error("Error in POST /api/users", err);
    res.status(500).json({ error: "Cannot get users" });
  }
});
