const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI);
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
const userSchema = new mongoose.Schema({
  username:{
    type: String,
    required: true
  },
  logs:{
    type: [Object]
  }
})
const User = mongoose.model("user", userSchema);
app.post("/api/users", (req, res) => {
  const username = req.body.username;
  let user = new User({
    username: username
  });
  user.save()
  .then((u) => {
    return res.json({_id: u._id, username: u.username})
  })
  .catch((err) => {
    res.status(500).json({error: err})
  })
})
app.get("/api/users", (req, res) => {
  User.find()
  .select({__v: false, logs: false})
  .exec()
  .then((users) => {
    res.json(users)
  })
})
app.post("/api/users/:_id/exercises", (req, res) => {
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  const dateunf = req.body.date ? new Date(req.body.date) : new Date();
  const date = dateunf.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).replace(/,/g, '');;
  const id = req.params._id
  const log = {
    description: description,
    duration: duration,
    date: date
  }
  User.findById(id)
  .then((user) => {
    user.logs.push(log)
    user.save()
    .then(() => {
      res.json({_id: user._id, username: user.username, date: date, duration: duration, description: description})
    })
    .catch((err) => {
      res.status(500).json({error:err})
    })
  })
  .catch((err) => {
    res.status(500).json({error:err})
  })
})
app.get("/api/users/:_id/logs", (req, res) => {
  const id = req.params._id;
  let fromDate = req.query.from;
  let toDate = req.query.to;
  const limit = parseInt(req.query.limit) || null;

  User.findById(id)
  .then((user) => {
    let logsArray = user.logs;
    if (fromDate) {
      fromDate = new Date(fromDate);
      logsArray = logsArray.filter((log) => {
        const date = new Date(log.date);
        return date >= fromDate;
      });
    }

    if (toDate) {
      toDate = new Date(toDate);
      logsArray = logsArray.filter((log) => {
        const date = new Date(log.date);
        return date <= toDate;
      });
    }

    if (limit) {
      logsArray = logsArray.slice(0, limit);
    }

    res.json({_id: user._id, username: user.username, count: user.logs.length, log:logsArray })
  })
  .catch((err) => {
    res.send(500).json({error: err})
  })
})
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
