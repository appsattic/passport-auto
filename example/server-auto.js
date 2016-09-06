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
const passportAuto = require('../')

// --- passport ---

const baseUrl = process.env.BASE_URL
const provider = {
  twitter : {
    consumerKey    : process.env.TWITTER_CONSUMER_KEY,
    consumerSecret : process.env.TWITTER_CONSUMER_SECRET,
  },
  github : {
    clientID       : process.env.GITHUB_CLIENT_ID,
    clientSecret   : process.env.GITHUB_CLIENT_SECRET,
  }
}

const opts = {
  callbackOpts : { successRedirect: '/', failureRedirect: '/' },
}
const authMiddleware = passportAuto(passport, baseUrl, opts, provider)

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

app.use('/auth', authMiddleware)

// --- webserver ---

const port = process.env.PORT
const server = http.createServer()
server.on('request', app)
server.listen(port, () => {
  console.log('Server listening on %s', baseUrl)
})

// --- fin ---
