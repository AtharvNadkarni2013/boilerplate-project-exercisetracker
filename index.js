const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

// Mongoose
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema(
  {
    username: String,
  },
  { versionKey: false }
);
const User = mongoose.model("User", userSchema);

const exerciseSchema = new mongoose.Schema({
  user_id: String,
  username: String,
  date: String,
  duration: Number,
  description: String,
});
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
  const { username } = req.body;
  const newUser = new User({ username });
  newUser.save((err, user) => {
    res.json(user);
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const { _id: userId } = req.params;
  let username;
  User.findById(userId)
    .select({ _id: 0, username: 1 })
    .exec((err, user) => {
      if (err) return res.json({ error: err.message });
      if (!user) return res.status(404).json({ error: "User does not exist" });

      username = user.username;
      const date = new Date(req.body.date);
      const duration = parseInt(req.body.duration);
      const newExercise = new Exercise({
        user_id: userId,
        username,
        date,
        duration,
        description: req.body.description,
      });
      newExercise.save((err, data) => {
        if (err) return console.error(err);
        delete data._doc.user_id
        delete data._doc.__v
        res.json(data);
      });
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
