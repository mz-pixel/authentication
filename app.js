import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv/config";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import passportLocal from "passport-local";
import passportLocalMongoose from "passport-local-mongoose";

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const url = "mongodb://0.0.0.0:27017/userDB";
const dbname = "userDB";

mongoose.connect(url, {});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  secret: String,
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/secrets");
  } else {
    res.render("login.ejs");
  }
});

app
  .route("/register")
  .post((req, res) => {
    User.register(
      { username: req.body.username },
      req.body.password,
      (err, user) => {
        if (err) {
          console.error(err);
          res.redirect("/register");
          return;
        }
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    );
  })
  .get((req, res) => {
    res.render("register.ejs");
  });

app.post("/login", passport.authenticate("local"), (req, res) => {
  res.redirect("/secrets");
});

app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    User.find({ secret: { $ne: null } })
      .then(function (foundUsers) {
        res.render("secrets", { usersWithSecrets: foundUsers });
      })
      .catch(function (err) {
        console.log(err);
      });
  } else {
    res.redirect("/login");
  }
});

app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit.ejs");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function (req, res) {
  User.findById(req.user)
    .then((foundUser) => {
      if (foundUser) {
        foundUser.secret = req.body.secret;
        return foundUser.save();
      }
      return null;
    })
    .then(() => {
      res.redirect("/secrets");
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
