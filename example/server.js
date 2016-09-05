// --------------------------------------------------------------------------------------------------------------------

"use strict"

// core
const http = require('http')

// npm
const express = require('express')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const passport = require('passport')
const passportAuto = require('../')

// --------------------------------------------------------------------------------------------------------------------
// setup passport

const baseUrl = process.env.BASE_URL

const allProviders = [ 'twitter', 'google', 'facebook', 'github' ]
const provider = {}
if ( process.env.TWITTER === 'true' ) {
  provider.twitter = {
    consumerKey    : process.env.TWITTER_CONSUMER_KEY,
    consumerSecret : process.env.TWITTER_CONSUMER_SECRET,
  }
}

if ( process.env.GOOGLE === 'true' ) {
  provider.google = {
    clientID       : process.env.GOOGLE_CLIENT_ID,
    clientSecret   : process.env.GOOGLE_CLIENT_SECRET,
    opts : {
      scope : [ 'profile' ],
    },
  }
}

if ( process.env.FACEBOOK === 'true' ) {
  provider.facebook = {
    clientID       : process.env.FACEBOOK_CLIENT_ID,
    clientSecret   : process.env.FACEBOOK_CLIENT_SECRET,
  }
}

if ( process.env.GITHUB === 'true' ) {
  provider.github = {
    clientID       : process.env.GITHUB_CLIENT_ID,
    clientSecret   : process.env.GITHUB_CLIENT_SECRET,
  }
}

// console.log('provider:', provider)
const authMiddleware = passportAuto(passport, baseUrl, provider)

// --------------------------------------------------------------------------------------------------------------------
// the app

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

app.get('/', (req, res) => {
  // see if the user is logged in
  if ( req.user ) {
    return res.send('<p>provider=' + req.user.provider + '<br>id=' + req.user.id + '<br>name=' + req.user.displayName + '</p><a href="/logout">Log Out</a>')
  }

  var html = []
  allProviders.forEach((providerName) => {
    if ( provider[providerName] ) {
      html.push('<li><a href="/auth/' + providerName + '">Sign in with ' + providerName + '</a></li>')
    }
    else {
      html.push('<li>' + providerName + ' is not set up</li>')
    }
  })
  res.send('<ul>' + html.join('<br>') + '</ul>')
})

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
})

// deals with both `/auth/provider` and `/auth/provider/callback`
app.use('/auth', authMiddleware)

// --------------------------------------------------------------------------------------------------------------------
// the webserver

const port = process.env.PORT
const server = http.createServer()
server.on('request', app)
server.listen(port, () => {
  console.log('Server listening on %s', baseUrl)
})

// --------------------------------------------------------------------------------------------------------------------
