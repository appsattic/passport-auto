// --- server-auto.js ---

"use strict"

// core
const http = require('http')

// npm
const express = require('express')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const htmlEscape = require('html-escape')
const passport = require('passport')
const TwitterStrategy = require('passport-twitter').Strategy
const GitHubStrategy = require('passport-github').Strategy

// --- passport ---

const baseUrl = process.env.BASE_URL

passport.serializeUser(function(user, done) {
  done(null, user)
})

passport.deserializeUser(function(obj, done) {
  done(null, obj)
})

var user = {}
function lookUpUser(profile, done) {
  // look up this profile in the datastore
  const socialId = profile.provider + '-' + profile.id

  if ( !(socialId in user) ) {
    user[socialId] = profile
  }

  setTimeout(() => {
    done(null, user[socialId])
  }, 100)
}

passport.use(new TwitterStrategy({
    consumerKey    : process.env.TWITTER_CONSUMER_KEY,
    consumerSecret : process.env.TWITTER_CONSUMER_SECRET,
    callbackURL    : baseUrl + "/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, cb) {
    lookUpUser(profile, cb)
  }
))

passport.use(new GitHubStrategy({
    clientID     : process.env.GITHUB_CLIENT_ID,
    clientSecret : process.env.GITHUB_CLIENT_SECRET,
    callbackURL  : baseUrl + "/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    lookUpUser(profile, cb)
  }
))

// --- application ---

const app = express()

app.use(morgan('dev'))
app.use(cookieParser())
app.use(session({
  resave            : false,
  saveUninitialized : false,
  secret            : 'secret',
}))
app.use(passport.initialize())
app.use(passport.session())

// --- routes ---

app.get('/', (req, res) => {
  var html

  // see if the user is logged in
  if ( req.user ) {
    html = [
      '<p>Hello &quot;' + htmlEscape(req.user.displayName) + '&quot;.</p>',
      '<p>You logged in with ' + htmlEscape(req.user.provider) + ', ',
      '(id=' + htmlEscape(req.user.id) + ').</p>',
      '<p><a href="/logout">Log Out</a></p>',
    ]
  }
  else {
    html = [
      '<h2>Passport Auto Example</h2>',
      '<ul>',
      '<li><a href="/auth/twitter">Sign in with Twitter</a></li>',
      '<li><a href="/auth/github">Sign in with GitHub</a></li>',
      '</ul>',
    ]
  }

  res.send(html.join(''))
})

app.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

const callbackOpts = { successRedirect: '/', failureRedirect: '/' }

app.get('/auth/twitter', passport.authenticate('twitter'))
app.get('/auth/twitter/callback', passport.authenticate('twitter', callbackOpts))

app.get('/auth/github', passport.authenticate('github'))
app.get('/auth/github/callback',passport.authenticate('github', callbackOpts))

// --- webserver ---

const port = process.env.PORT
const server = http.createServer()
server.on('request', app)
server.listen(port, () => {
  console.log('Server listening on %s', baseUrl)
})

// --- fin ---
