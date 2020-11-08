const fs = require("fs");
const axios = require("axios");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
var OAuth2Strategy = require("passport-ping-oauth2");
const redirectWithParams = require("./utils").redirectWithParams;
const buildQueryStringFromObject = require("./utils")
  .buildQueryStringFromObject;
const ensureAuthenticated = require("./utils").ensureAuthenticated;
const path = require("path");
const AWS = require("aws-sdk");
const s3 = new AWS.S3({ region: "us-east-1" });
const cors = require("cors");
const compression = require("compression");
const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
const jwt = require('./auth')
const tx = require('./query_handler')
const utils = require('./utils')
const app = express();

app.set("etag", false);
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

const router = express.Router();
const logMessage = require("./utils").logMessage;

const corsOptions = {
  optionsSuccessStatus: 200,
  credentials: true,
  origin: '*',
  methods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
  headers: [
    "Accept",
    "Content-Type",
    "Authorization",
    "X-Amz-Date",
    "X-Api-Key",
    "X-Amz-Security-Token",
    "Access-Control-Expose-Headers"
  ],
};

// router.use(function (req, res, next) {
//   res.setHeader("Cache-Control", "max-age=5, stale-while-revalidate=3600");
//   next();
// });
router.use(compression());
router.use(cors(corsOptions));
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(awsServerlessExpressMiddleware.eventContext());

// Configuration
// ==============================================
const AppBucketName = process.env.AppBucketName
  ? process.env.AppBucketName
  : "hw-app-a5e2ccf9-3"; // dev bucket
// : "hw-app-team-hopper" //hopper bucket
// let callbackURL = 'http://localhost:3000/login/callback';
// let callbackURL = 'login/callback';
let callbackURL = 'https://status.devops.heavywater.com/login/callback';
const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const sessionSecret = process.env.SESSION_SECRET;
const authorizationURL = process.env.AUTHORIZATION_URL;
const tokenURL = process.env.TOKEN_URL;
// Strategy Configuration
// ==============================================
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});
var auth={}
var OAuthStrategy = new OAuth2Strategy(
  {
    authorizationURL: authorizationURL,
    tokenURL: tokenURL,
    clientID: clientID,
    clientSecret: clientSecret,
    callbackURL: callbackURL,
    state: false,
  },
  function (accessToken, refreshToken, extraParams, profile, done) {
    logMessage("Access Token : ",accessToken)
    logMessage("Id token :",extraParams.id_token)
    logMessage("refreshToken :",refreshToken)
    logMessage("extraParams : ",extraParams)
    auth = extraParams
    return done(null, profile);
  }
);

passport.use(OAuthStrategy);


  
app.use(cookieParser());
app.use(
  session({
    secret: sessionSecret,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false } // Remember to set this
    // cookie: {
    //   ephemeral: false,
    //   secure: false
    // }

  })
);
app.use(passport.initialize()); 
app.use(passport.session());

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});


router.get("/", ensureAuthenticated, function (req, res) {
  var response = fs.readFileSync(path.join(__dirname, "./index.html"), "utf8");
  response = response.replace(
    /http:\/\/localhost:3000/g,
    process.env.DocumentUploadDomainName
  );
  
  res.setHeader("Content-Type","text/html");
  res.send(response);
});

// var JwtStrategy = require('passport-jwt').Strategy,
//     ExtractJwt = require('passport-jwt').ExtractJwt;
// var opts = {}
// opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
// opts.secretOrKey = 'secret';
// opts.issuer = 'accounts.examplesoft.com';
// opts.audience = 'yoursite.net';





router.get('/tx', async (req, res) => {
  var auth_res = await jwt.verify(req.headers.authorization)
  if(!auth_res){
    res.status(401)
    return res.send('access denied')
  }
  // {...req.query}
  var data = await tx.received();
  return res.json(data)
});


 
router.get('/public/microfrontend.js*', async (req, res) => {
  var module_path = `${__dirname}/${req.path.slice(1)}`
  if(req.apiGateway){
    var umd_module = await fs.readFileSync(module_path)
    umd_module = umd_module.toString().replace(/http:\/\/localhost:3000/g, 'https://'+req.apiGateway.event.headers.Host)
    umd_module = umd_module.replace(/\{jwt_token\}/g,auth.id_token);
    console.log('auth', auth)
    res.send(umd_module)
  }else{
    res.sendFile(module_path)
  }
});

router.get('/js/*',ensureAuthenticated, (req, res) => {
  res.sendFile(`${__dirname}/${req.path.slice(1)}`)
})
router.get('/public/*',ensureAuthenticated, (req, res) => {
  res.sendFile(`${__dirname}/${req.path.slice(1)}`)
})


router.get("/login", function (req, res, next) {
  let queryString = buildQueryStringFromObject(req.query);
  const params = {
    scope: ["openid", "profile", "email"],
    state: Buffer.from(JSON.stringify(req.query)).toString("base64"),
  };
  passport.authenticate("oauth2", params, function (err, user, info) {
    redirectWithParams(res, queryString, "/");
  })(req, res, next);
});

router.get("/login/callback", async function (req, res, next) {
  return passport.authenticate("oauth2", function (err, user, info) {
    if (err) {
      return res.redirect("/login/fail");
    }
    if (!user) {
      return res.redirect("/login/fail");
    }
    const queryParams = JSON.parse(
      Buffer.from(req.query.state, "base64").toString("ascii")
    );
    const queryString = buildQueryStringFromObject(queryParams);
    return req.logIn(user, function (err) {
      console.log('user',user)
      if (err) {
        return res.redirect("/login/fail");
      }
      return redirectWithParams(res, queryString, "/");
    });
  })(req, res, next);
});

router.get("/login/fail", function (req, res) {
  res.send("Error: Could not Login");
});

router.use(function (err, req, res, next) {
  console.log("Fatal error: " + JSON.stringify(err));
  next(err);
});

app.use("/", router);

module.exports = app;
