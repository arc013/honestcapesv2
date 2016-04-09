// Node.js Dependencies
const express = require("express");
const app = express();
const http = require("http").createServer(app);
// const io = require("socket.io")(http);
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);

var mongoose = require('mongoose');
var passport = require('passport');
var handlebars = require('express-handlebars');

require("dotenv").load();
var models = require("./models");
var db = mongoose.connection;

var router = { 
	index: require("./routes/index")
};

// var models = require("./");

var parser = {
    body: require("body-parser"),
    cookie: require("cookie-parser")
};

var strategy = {
	Twitter: require('passport-twitter').Strategy
};

// Database Connection
/* TODO */

// session middleware
var session_middleware = session({
    key: "session",
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: true,
    store: new MongoStore({ mongooseConnection: db })
});

// Middleware
app.set("port", process.env.PORT || 3000);
app.engine('html', handlebars({ defaultLayout: 'layout', extname: '.html' }));
app.set("view engine", "html");
app.set("views", __dirname + "/views");
app.use(express.static(path.join(__dirname, "public")));
app.use(parser.cookie());
app.use(parser.body.urlencoded({ extended: true }));
app.use(parser.body.json());
app.use(require('method-override')());
app.use(session_middleware);
/* TODO: Passport Middleware Here*/
app.use(passport.initialize());
app.use(passport.session());

/* TODO: Use Twitter Strategy for Passport here */
passport.use(new strategy.Twitter({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: "/auth/twitter/callback"
}, function(token, tokenSecret, profile, done) {

    models.User.findOne({ "twitterID": profile.id }, function(err, user) {
    // (1) Check if there is an error. If so, return done(err);
    if (err)
        return done(err);
    if(!user) {
        // (2) since the user is not found, create new user.
        // Refer to Assignment 0 to how create a new instance of a model
        var newUser = new models.User();

        // set all of the user data that we need
        newUser.twitterId = profile.id;
        newUser.token = token;
        newUser.username = profile.username;
        newUser.displayName = profile.displayName;
        newUser.photos = profile.photos;

        // save our user into the database
         newUser.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, newUser);
                    });
    } else {
        // (3) since the user is found, update user’s information
        process.nextTick(function() {
            return done(null, profile);
        });
    }
  });
  }
));
/* TODO: Passport serialization here */
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(user, done) {
    done(null, user);
});
// Routes
/* TODO: Routes for OAuth using Passport */
app.get("/", router.index.view);
// More routes here if needed
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { successRedirect: '/',
                                     failureRedirect: '/' }));

// io.use(function(socket, next) {
//     session_middleware(socket.request, {}, next);
// });

/* TODO: Server-side Socket.io here */

// Start Server
http.listen(app.get("port"), function() {
    console.log("Express server listening on port " + app.get("port"));
});
