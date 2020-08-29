var express = require("express");
var passport = require("passport");
var Strategy = require("passport-twitter").Strategy;
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./resources/User");
const Tweet = require("./resources/Tweet");
const { consumerKey, consumerSecret } = require("./keys");
const { PORT = 3000 } = process.env;

// Configure the Twitter strategy for use by Passport.
//
// OAuth 1.0-based strategies require a `verify` function which receives the
// credentials (`token` and `tokenSecret`) for accessing the Twitter API on the
// user's behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(
  new Strategy(
    {
      consumerKey: consumerKey,
      consumerSecret: consumerSecret,
      callbackURL: "/oauth/callback",
      includeEmail: true
    },
    function(token, tokenSecret, profile, cb) {
      User.findOrCreate(
        {
          twitterId: profile.id,
          name: profile._json.name,
          screen_name: profile._json.screen_name,
          url: profile._json.url,
          description: profile._json.description,
          followers_count: profile._json.followers_count,
          profile_image_url_https: profile._json.profile_image_url_https
        },
        function(err, user) {
          return cb(err, user);
        }
      );
    }
  )
);

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Twitter profile is serialized
// and deserialized.
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

// Create a new Express application.
var app = express();

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require("morgan")("combined"));
app.use(require("body-parser").urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://www.eztweeter.com", // allow to server to accept request from different origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true // allow session cookie from browser to pass through
  })
);
app.use(
  require("express-session")({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true
  })
);
app.use(express.json());

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

const isLoggedIn = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

mongoose.connect("mongodb://wes:SedrfT6^@ds029496.mlab.com:29496/tweeter", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
  console.log("mongoose connected");
});

// Define routes.
app.get("/user", isLoggedIn, (req, res) => {
  res.send(req.user);
});

app.get("/login", (req, res) => {
  console.log("you will need to log in sir or ma'am");
  res.send("you are not logged in");
});

app.get("/auth/twitter", passport.authenticate("twitter"));

app.get(
  "/oauth/callback",
  passport.authenticate("twitter", {
    failureRedirect: "/login",
    successRedirect: "http://www.eztweeter.com/dashboard"
  })
);

app.get("/logout", (req, res) => {
  req.logout();
  console.log(`is authenticated ${req.isAuthenticated()}`);
  console.log(`user is ${req.user}`);
  res.redirect("/login");
});

// populates an array of objects
// Tweet.find(function(err, tweets) {
//   var opts = [{ path: "user", match: { x: 1 } }];

//   var promise = Tweet.populate(tweets, opts);
//   promise.then(console.log(tweets)).exec;
// });

// Get all tweets
app.get("/tweet", isLoggedIn, (req, res) => {
  Tweet.find()
    .populate("createdBy")
    .sort({ createdAt: "desc" })
    .exec(function(err, tweets) {
      res.send(tweets);
    });
  // populates an array of objects

  // Tweet.find(function(err, tweets) {
  //   var opts = [{ path: "user", match: { x: 1 }, select: "name" }];

  //   var promise = User.populate(tweets, opts);
  //   promise.then(res.send(tweets)).exec;
  // });
});

// Create a tweet
app.post("/tweet", isLoggedIn, (req, res) => {
  console.log(req.body);
  const tweet = new Tweet({
    tweet: req.body.tweet,
    createdBy: "5f401ad7df0ba630e49385b1"
  });
  tweet.save(function(e) {
    if (e) console.log(e);
  });
  // Tweet.create({ body: 'My first tweet!', createdBy: '5f401ad7df0ba630e49385b1'})
  res.send(`tweet ${tweet.id} created!`);
});

// Get a tweet
app.get("/tweet/:id", isLoggedIn, (req, res) => {
  Tweet.find({ _id: req.params.id })
    .then(result => console.log(result))
    .catch(e => console.error(e));
  res.send("hi");
});

// Delete a tweet
app.post("/tweet/:id", isLoggedIn, (req, res) => {
  Tweet.findByIdAndDelete(req.params.id)
    .then(response => console.log(response))
    .catch(e => console.error(e));
  res.send(`${req.params.id} is deleted`);
});

// Edit a tweet
app.put("/tweet/:id", isLoggedIn, (req, res) => {
  const tweet = { tweet: req.body.tweet, createdBy: req.body.createdBy };
  Tweet.findByIdAndUpdate(req.params.id, tweet)
    .then(response => console.log(response))
    .catch(e => console.error(e));
  res.send(`${req.body.tweet}`);
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
