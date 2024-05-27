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
  date: Date,
  duration: Number,
  description: String,
});
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use((req, res, next) => {
  console.log(req.url, req.method, req.body, req.params)
  next()
})

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get('/api/users', (req, res) => {
  User.find({}, (err, data) => {
    res.json(data)
  })
})

app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query
  let response = {};
  User.findById(_id).exec((err, userData) => {
    if (!userData) {
      return res.json({error: "no user data"})
    }
    response = userData._doc
    let findBy = {user_id: _id}
    if (from) {
      findBy = Object.assign({}, findBy, {date: {$gt: new Date(from)}})
    }
    if (to) {
      findBy = Object.assign({}, findBy, {date: {$lt: new Date(to)}})
    }
    console.log(findBy)
    Exercise.find(findBy).select({description: 1, duration: 1, date: 1, _id: 0}).limit(parseInt(limit)).exec((err, exerciseData) => {
      exerciseData.forEach(dat => {
        dat._doc.date = new Date(dat.date).toDateString()
      })
      response.count = exerciseData.length
      response.log = exerciseData
      res.json(response)
    })
  })
})

app.post("/api/users", (req, res) => {
  const { username } = req.body;
  const newUser = new User({ username });
  newUser.save((err, user) => {
    if (err) return console.error(err)
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
      let date;
      if (req.body.date) {
        date = new Date(req.body.date).toDateString();
      } else {
        date = new Date().toDateString();
      }
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
        const userId = data.user_id;
        delete data._doc.user_id
        delete data._doc.__v
        data._doc._id = userId
        data._doc.date = new Date(data.date).toDateString();
        res.json(data);
      });
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
