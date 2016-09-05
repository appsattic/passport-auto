# Passport Auto #

An easy way to use Passport and the various strategies in your Express server. It follows all of the examples on the
`passport-*` documentation. Because you still need to require `passport` yourself and pass it to `passportAll`, then
you can still do your own setup directly on the `passport` object (such as serialization).

List of currently supported strategies:

* Twitter (passport-twitter)
* Google OAuth 2.0 (using passport-google-oauth20)
* Facebook (passport-facebook)
* GitHub (passport-github)

I am happy to start adding more to the default list. This is just the starting list to get this package out there.

## Synopsis ##

Firstly, install `passport`, `passport-auto`, and any other strategies you require, e.g. Twitter and GitHub:

```sh
$ npm install --save passport passport-auto passport-twitter passport-github
```

Then, setup `passport-auto` with your strategy configuration, and pass in your passport instance:

```js
const passport = require('passport')
const passportAuto = require('passport-auto')

const baseUrl = 'http://example.com'
const provider = {
  twitter : {
    consumerKey    : process.env.TWITTER_CONSUMER_KEY,
    consumerSecret : process.env.TWITTER_CONSUMER_SECRET,
  },
  github : {
    clientID       : process.env.GITHUB_CLIENT_ID,
    clientSecret   : process.env.GITHUB_CLIENT_SECRET,
  },
}

const authMiddleware = passportAuto(passport, baseUrl, provider)
```

You will be returned your auth middleware. Keep a reference to this. Then initialise passport in your Express app as
you usually do (probably around where you set up your cookie parsing and sessions, and perhaps before you add
`app.get('/')`):

```js
app.use(passport.initialize())
app.use(passport.session())
```

Earlier you were returned the auth middleware from the passport-auto setup. This middleware listens for any requests to
`/auth/provider` and `/auth/provider/callback`, for all of the providers you have set up. In this final step, you use
it just like any other express middleware on your application.

```js
app.use('/auth', authMiddleware)
```

That's it! :) See below for options and advanced uses.

(For a full example, see the `example/server.js` in this repo, which also has it's own ReadMe.md for more instructions.)

## Provider Options to Configure the Auth Middleware ##

Each provider requires the application IDs, keys, and/or secrets specified in the docs for that same provider,
therefore you should read the 'passport-*' page relevant to the one you're currently using. e.g. for GitHub you'd need
both `clientID` and `clientSecret` but for Twitter you'd need both `consumerKey` and `consumerSecret`. Other providers
may be different.

You can also pass in both an `authOpts` and a `callbackOpts` for each provider, one for configuring the
`/auth/provider` route and the other for configuring the `/auth/provider/callback` route. Each of these is opaque to
passport-auto and are just passed on to passport as-is.

e.g. for Google, you may want to define which scope you require. You must pass this to every provider you wish to
configure differently.

```js
const provider = {
  google : {
    authOpts : {
      scope: [ 'profile' ],
    },
  },
}
```

Or perhaps you want a different `failureRedirect` to the default `'/'`. You must pass this to every provider you wish
to configure.

```js
const provider = {
  facebook : {
    callbackOpts : {
      failureRedirect: '/login',
    },
  },
}
```

### `authOpts` ###

If you do not provide an `authOpts`, then the empty object `{}` is passed to the strategy middleware. This is
essentially the same as a no-op and therefore can be left empty.

However, you may need to pass something extra (such as the scope you require) to the first authentication step so the
provider knows what to ask the user for and subsequently grant. For example, for `passport-google` you may wish to ask
for a specific scope:

```js
const provider = {
  google : {
    authOpts : {
      clientID     : '...',
      clientSecret : '...',
      scope        : [ 'profile' ],
    },
  },
}
```

### `callbackOpts` ###

The callback middleware from the provider may be configured with something relevant to the provider. The default
`callbackOpts` is just `{ failureRedirect: '/' }`, so if you would like to do something different, then pass in
something else. Whatever you provide here is opaque to passport-auto and will be passed along to the Passport strategy
as-is.

For example, let's redirect to the login page if Facebook auth fails:

```js
const provider = {
  facebook : {
    clientID     : '...',
    clientSecret : '...',
    callbackOpts : { failureRedirect : '/login' },
  },
}
```

## Generic Options ##

You can optionally pass in an `opts` object as part of setup. This `opts` object may contain any of these:

* `serializeUser(user, done)`
* `deserializeUser(id, done)`
* `lookUpUser(profile, tokens, done)`

Without specifying any of these, you will be using simple functions provided by passport-auto. These are ok for getting
started with development, but not for production. Please provide your own. See the PassportJS docs for more
information.

### Sessions: `serializeUser()` and `deserializeUser()` ###

There are simple defaults for the passport `serializeUser`, `deserializeUser`, and `lookUpUser` functions which you may
use. If you would like to do this yourself, just pass these functions in the options `opts` field. Warning: the
`lookUpUser` uses an in-memory datastore which is great for development, but terrible for production. Do not use in
production.

```js
function serializeUser(user, done) {
  // ...
}

function deserializeUser(id, done) {
  // ...
}

var opts = {
  serializeUser   : serializeUser,
  deserializeUser : deserializeUser,
}
passportAuto(passport, 'https://example.com', opts, provider)
```

### Storing/Reading your Datastore with `lookUpUser()` ###

By default, passport-auto gives you a simple in-memory store backend for storing and looking up your users. This is
awesome for getting started with development, but also a terrible idea in production. You will write a different
version related to your backend datastore needs. This is similar to what passport already expects you to do.

Providing this function means that passport can find your user in your database, based on the profile that was given to
you by the provider. The function signature of this function is the only part of passport that passport-auto deviates
from. This is because different providers return different tokens to you, therefore we can't be generic unless we
change it slightly. ie. by collecting up all tokens into a `tokens` object.

As an example, the function signature of `lookUpUser` is different depending on which strategies you are using. Let's
take a look at a couple of different strategies.

* passport-twitter expects `function(token, tokenSecret, profile, cb) { ... }`
* passport-github expects `function(accessToken, refreshToken, profile, cb) { ...}`

What passport-auto does is squish the tokens together (whatever was returned from the provider) into a `tokens`
object. This means the function signature of your `lookUpUser` should be more like:

```js
function lookUpUser(profile, tokens, done) {
  // ... your code goes here, call `done(err, user)` to finish

  // `profile` here is what is returned from passport, e.g. { provider : 'twitter', id : 1024, ... }

  User.findOrCreate({ provider: profile.provider, id: profile.id }, function (err, user) {
    return done(err, user)
  })
}

const authMiddleware = passportAuto(passport, baseUrl, { lookUpUser : lookUpUser }, provider)
var opts = {
  serializeUser   : serializeUser,
  deserializeUser : deserializeUser,
}
passportAuto(passport, 'https://example.com', opts, provider)
```

Just call `done(null, user)` with whatever user you wish to place into the express/passport session, or call
`done(err)` if something went wrong.

## Project Pages ##

There are two articles you can read about passport-auto. The first is a guide to using passport-auto in different ways
and the second is a more in-depth explanation of how it works behind the scenes.

* https://appsattic.com/project/passport-auto/
* Coming soon ... https://appsattic.com/project/passport-auto/guide
* Coming soon ... https://appsattic.com/project/passport-auto/in-depth
* Coming soon ... https://appsattic.com/project/passport-auto/example-using-mongodb
* Coming soon ... https://appsattic.com/project/passport-auto/example-using-mongodb

## Author ##

Written by:

* [web - Andrew Chilton](https://chilts.org/)
* [twitter - andychilton](https://twitter.com/andychilton)
* [github - chilts](https://github.com/chilts/)

For AppsAttic:

* [web - AppsAttic - Website](https://appsattic.com/)
* [twitter - AppsAtticLtd - Twitter](https://twitter.com/AppsAtticLtd)
* [github - appsattic](https://github.com/chilts/)

(Ends)
