// --------------------------------------------------------------------------------------------------------------------

"use strict"

// --------------------------------------------------------------------------------------------------------------------
// Passport Setup

function checkArgs(provider, obj, keys) {
  for(let i = 0; i < keys.length; i++) {
    if ( !(keys[i] in obj) ) {
      throw new Error("passport-all: provider " + provider + ' must have the following opts set:' + keys.join(', '))
    }
  }
}

function serializeUser(user, done) {
  done(null, user)
}

function deserializeUser(obj, done) {
  done(null, obj)
}

var user = {}
function lookUpUser(profile, tokens, done) {
  // look up this profile in the datastore
  const socialId = profile.provider + '-' + profile.id

  if ( !(socialId in user) ) {
    user[socialId] = profile
  }

  setTimeout(() => {
    done(null, user[socialId])
  }, 100)
}

const authOpts     = {}
const callbackOpts = { failureRedirect: '/' }

function passportAuto(passport, baseUrl, opts, provider) {
  if ( !provider ) {
    provider = opts || {}
    opts = {}
  }

  // console.log('setup: ', passport, baseUrl, opts, provider)

  // set some defaults
  opts.serializeUser   = opts.serializeUser   || serializeUser
  opts.deserializeUser = opts.deserializeUser || deserializeUser
  opts.lookUpUser      = opts.lookUpUser      || lookUpUser
  opts.redirect        = opts.redirect        || '/'

  // Serialize and Deserialize the User
  passport.serializeUser(opts.serializeUser || function(user, done) {
    done(null, user)
  })
  passport.deserializeUser(opts.deserializeUser || function(obj, done) {
    done(null, obj)
  })

  // check we have been given some things
  if ( !passport ) {
    throw new Error("passport-auto: please pass in your `passport` instance (ie. the result of `require('passport')`)")
  }
  if ( !baseUrl ) {
    throw new Error("passport-auto: provide a baseUrl such as 'https://example.com' or 'http://localhost:8080'")
  }

  var providers = Object.keys(provider)

  // ------------------------------------------------------------------------------------------------------------------
  // Twitter Setup - https://www.npmjs.com/package/passport-twitter

  // From: https://apps.twitter.com/

  if ( 'twitter' in provider ) {
    // check that we have the correct fields
    checkArgs('twitter', provider.twitter, [ 'consumerKey', 'consumerSecret' ])

    const twitter = require('passport-twitter')
    const twitterCredentials = {
      consumerKey    : provider.twitter.consumerKey,
      consumerSecret : provider.twitter.consumerSecret,
      callbackURL    : baseUrl + '/auth/twitter/callback',
    }
    passport.use(new twitter.Strategy(twitterCredentials, (token, tokenSecret, profile, done) => {
      var tokens = {}
      if ( token ) {
        tokens.token = token
      }
      if ( tokenSecret ) {
        tokens.tokenSecret = tokenSecret
      }
      lookUpUser(profile, tokens, done)
    }))

    // set up the 'auth' and 'callback' middleware
    provider.twitter.auth     = passport.authenticate('twitter', provider.twitter.authOpts     || authOpts)
    provider.twitter.callback = passport.authenticate('twitter', provider.twitter.callbackOpts || callbackOpts)
  }

  // ------------------------------------------------------------------------------------------------------------------
  // Google Setup - https://www.npmjs.com/package/passport-google-oauth20

  if ( 'google' in provider ) {
    // check that we have the correct fields
    checkArgs('google', provider['google'], [ 'clientID', 'clientSecret' ])

    const google = require('passport-google-oauth20')
    const googleCredentials = {
      clientID     : provider.google.clientID,
      clientSecret : provider.google.clientSecret,
      callbackURL  : baseUrl + '/auth/google/callback',
    }
    passport.use(new google.Strategy(googleCredentials, (accessToken, refreshToken, profile, done) => {
      var tokens = {}
      if ( accessToken ) {
        tokens.accessToken = accessToken
      }
      if ( refreshToken ) {
        tokens.refreshToken = refreshToken
      }
      lookUpUser(profile, tokens, done)
    }))

    // set up the 'auth' and 'callback' middleware
    provider.google.auth     = passport.authenticate('google', provider.google.authOpts     || authOpts)
    provider.google.callback = passport.authenticate('google', provider.google.callbackOpts || callbackOpts)
  }

  // ------------------------------------------------------------------------------------------------------------------
  // Facebook Setup - https://www.npmjs.com/package/passport-facebook

  if ( 'facebook' in provider ) {
    // check that we have the correct fields
    checkArgs('facebook', provider.facebook, [ 'clientID', 'clientSecret' ])

    const facebook = require('passport-facebook')
    const facebookCredentials = {
      clientID     : provider.facebook.clientID,
      clientSecret : provider.facebook.clientSecret,
      callbackURL  : baseUrl + '/auth/facebook/callback',
    }
    passport.use(new facebook.Strategy(facebookCredentials, (accessToken, refreshToken, profile, done) => {
      var tokens = {}
      if ( accessToken ) {
        tokens.accessToken = accessToken
      }
      if ( refreshToken ) {
        tokens.refreshToken = refreshToken
      }
      lookUpUser(profile, tokens, done)
    }))

    // set up the 'auth' and 'callback' middleware
    provider.facebook.auth     = passport.authenticate('facebook', provider.facebook.authOpts     || authOpts)
    provider.facebook.callback = passport.authenticate('facebook', provider.facebook.callbackOpts || callbackOpts)
  }

  // ------------------------------------------------------------------------------------------------------------------
  // GitHub Setup - https://www.npmjs.com/package/passport-github

  if ( 'github' in provider ) {
    // check that we have the correct fields
    checkArgs('github', provider.github, [ 'clientID', 'clientSecret' ])

    const github = require('passport-github')
    const githubCredentials = {
      clientID     : provider.github.clientID,
      clientSecret : provider.github.clientSecret,
      callbackURL  : baseUrl + '/auth/github/callback',
    }
    passport.use(new github.Strategy(githubCredentials, (accessToken, refreshToken, profile, done) => {
      var tokens = {}
      if ( accessToken ) {
        tokens.accessToken = accessToken
      }
      if ( refreshToken ) {
        tokens.refreshToken = refreshToken
      }
      lookUpUser(profile, tokens, done)
    }))

    // set up the 'auth' and 'callback' middleware
    provider.github.auth     = passport.authenticate('github', provider.github.authOpts     || authOpts)
    provider.github.callback = passport.authenticate('github', provider.github.callbackOpts || callbackOpts)
  }

  // authMiddleware - add this to your app, e.g. `app.use('/auth', authMiddleware)`
  return function(req, res, next) {
    // just go on the original pathname
    var path = req._parsedOriginalUrl.pathname

    // check all our providers ... only one (or none) will match
    for(let i = 0; i < providers.length; i++ ) {
      let name = providers[i]
      // check for `/auth/provider` and call the middleware set up previously
      if ( path === '/auth/' + name ) {
        return provider[name].auth(req, res, next)
      }

      // check for `/auth/provider/callback` and call the middleware set up previously
      if ( path === '/auth/' + name + '/callback' ) {
        return provider[name].callback(req, res, (err) => {
          if (err) return next(err)
          res.redirect(opts.redirect)
        })
      }

      // don't check for any other routes
    }

    // if we have fallen through here, just call next since we don't know anything about this route
    next()
  }
}

// --------------------------------------------------------------------------------------------------------------------

module.exports = passportAuto

// --------------------------------------------------------------------------------------------------------------------
