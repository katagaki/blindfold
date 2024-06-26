/*!
 * Node.js Server Script
 */
const promiseLimit = require("promise-limit");
const express = require("express");
const sanitizer = require("express-sanitizer");
const cors = require("cors");
const session = require("express-session");
const { createClient } = require("redis");
const redisStore = require("connect-redis")(session);
const config = require("./config");
const path = require("path");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cache = require("apicache");
const cacheMiddleware = cache.middleware;
const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;
const Twitter = require("twitter");
const isEmpty = require("lodash/fp/isEmpty");
const { expressCspHeader, INLINE, NONE, SELF } = require("express-csp-header");

export default (app) => {
    const redisClient = createClient(process.env.REDIS_URL);
    
    redisClient.on("connect", function () {
        console.log("Connected to Redis");
    });
    
    redisClient.on("error", (err) => {
        console.log("Redis error: ", err);
    });
    
    var nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    
    var _twitter;
    var _limit = promiseLimit(25);
    
    app.set("trust proxy", true);
    app.use(helmet());
    app.use(cors({ credentials: true, origin: "frontend address" }));
    app.use(
            expressCspHeader({
            directives: {
                "default-src": [SELF],
                "script-src": [SELF, INLINE, "*.googleapis.com", "*.gstatic.com"],
                "style-src": [SELF, INLINE, "*.googleapis.com", "*.gstatic.com"],
                "img-src": [SELF, "data:", "*.twimg.com", "*.gstatic.com"],
                "worker-src": [SELF],
                "block-all-mixed-content": true,
            },
            })
            );
    app.use(express.static(path.join(__dirname, "./../dist"), { index: false }));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(sanitizer());
    
    passport.use(
                 new TwitterStrategy(
                                     {
                                     consumerKey: config.app_key,
                                     consumerSecret: config.app_secret,
                                     callbackURL: "/api/auth/callback",
                                     proxy: true,
                                     includeStatus: true,
                                     passReqToCallback: true,
                                     },
                                     function (req, token, tokenSecret, profile, done) {
                                         const { id, username, displayName, photos } = profile;
                                         
                                         return done(
                                                     null,
                                                     {
                                                         id,
                                                         username,
                                                         displayName,
                                                     photo: photos[0].value,
                                                     },
                                                     { access_token_key: token, access_token_secret: tokenSecret }
                                                     );
                                     }
                                     )
                 );
    
    passport.serializeUser((user, done) => {
        done(null, user);
    });
    
    passport.deserializeUser((user, done) => {
        done(null, user);
    });
    
    app.use(
            session({
            secret: config.salt,
            name: "_session",
            saveUninitialized: false,
            resave: false,
            rolling: false,
            cookie: {
            secure: "auto",
            key: "_blindfold",
            sameSite: "Lax",
            httpOnly: true,
            maxAge: 30 * 24 * 36000,
            expires: nextYear,
            },
            store: new redisStore({ client: redisClient }),
            })
            );
    
    app.use(passport.initialize());
    app.use(passport.session());
    
    function checkAuth(req, res, next) {
        try {
            if (req.user) {
                next();
            } else {
                res.status(401).json({ error: "abandon all hope" });
            }
        } catch {
            res.status(500).json({ error: "something went wrong" });
        }
    }

    // Initiate authentication with Twitter
    app.get("/api/auth", passport.authenticate("twitter"));
    
    // Process Twitter callback and verify authentication
    app.get(
            "/api/auth/callback",
            passport.authenticate("twitter", {
            failureRedirect: "/401",
            }),
            (req, res) => {
                if (req.user) {
                    // store user access tokens in a local session
                    req.session.authInfo = req.authInfo;
                    res.redirect("/");
                } else {
                    res.status(401).end();
                }
            }
            );
    
    // handle 401 route
    app.get("/401", (req, res) => {
        res.status(401).end();
    });
    
    // get user profile data
    app.get("/api/profile", checkAuth, function (req, res) {
        res.status(200).json({ profile: req.user });
    });
    
    // nuke the session
    app.post("/api/signout", function (req, res) {
        req.session = null;
        res.status(200).end();
    });
    
    // enable/disable retweets
    app.post(
             "/api/friends",
             checkAuth,
             function (req, res, next) {
                 // setTimeout(() => res.status(500), 2500);
                 _twitter = new Twitter({
                 consumer_key: config.app_key,
                 consumer_secret: config.app_secret,
                 access_token_key: req.session.authInfo.access_token_key,
                 access_token_secret: req.session.authInfo.access_token_secret,
                 });
                 _twitter
                 .get("friends/ids", { stringify_ids: true })
                 .then(function (response) {
                     res.following = response.ids;
                     next();
                 })
                 .catch(function (errors) {
                     res
                     .status(500)
                     .json({ error: "Problem getting friends/ids", details: errors });
                 });
             },
             function (req, res, next) {
                 Promise.all(
                             res.following.map(function (id) {
                                 return _limit(function () {
                                     return _twitter
                                     .post("friendships/update", {
                                     user_id: id,
                                     retweets: req.body.wantRetweets,
                                     })
                                     .catch(function (errors) {
                                         res.status(500).json({ errors });
                                     });
                                 });
                             })
                             )
                 .then(function () {
                     next();
                 })
                 .catch(function (errors) {
                     res.status(500).json({ errors });
                 });
             },
             function (req, res) {
                 _twitter
                 .get("friendships/no_retweets/ids", {})
                 .then(function (response) {
                     cache.clear("friends");
                     res.status(200).end();
                 })
                 .catch(function (errors) {
                     res.status(500).json({
                     error: "Problem getting `no_retweets` ids",
                     details: errors,
                     });
                 });
             }
             );
};
