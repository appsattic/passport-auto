## ----------------------------------------------------------------------------

# On my machine, I have a proxy from passport.127.0.0.1.xip.io to
# localhost:9259 for this example server. You need to set this up with however
# you do local development. e.g. BASE_URL=http://localhost:3000, PORT=3000.

 export BASE_URL=http://passport.127.0.0.1.xip.io
 export PORT=9259

# Set each of these providers to 'true' or 'false'. If you set one to true,
# then you should also set the application credentials for the app you received
# when creating it on each platform.

 export TWITTER=false
 export TWITTER_CONSUMER_KEY=...
 export TWITTER_CONSUMER_SECRET=...

 export GOOGLE=false
 export GOOGLE_CLIENT_ID=...
 export GOOGLE_CLIENT_SECRET=...

 export FACEBOOK=false
 export FACEBOOK_CLIENT_ID=...
 export FACEBOOK_CLIENT_SECRET=...

 export GITHUB=false
 export GITHUB_CLIENT_ID=...
 export GITHUB_CLIENT_SECRET=...

## ----------------------------------------------------------------------------
