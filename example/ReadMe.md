# Example Server #

This simple server shows a very simple login page, and a very simple authenticated page for each of the providers you
set up.

You'll need to do three things:

1. install the relevant packages plus any passport-* providers
2. set up some environment variables
3. start the server

So let's just do that for Twitter:

```sh
$ npm install express morgan cookie-parser express-session passport passport-auto passport-twitter
...etc...
$ export BASE_URL=http://localhost:3000
$ export PORT=3000
$ export TWITTER=true
$ export TWITTER_CONSUMER_KEY=...
$ export TWITTER_CONSUMER_SECRET=...
$ npm server.js
Server listening on http://localhost:3000
```

Then go to your browser and hit `localhost:3000` and click on 'Sign in with Twitter' (you'll notice that
it'll tell you the options for Google, Facebook, and GitHub are not available).

Once you have logged in, the page will tell you your Provider, ID and Name at that provider.

Here's an example server log of those 4 page hits where you can see we hit the homepage, start the authentication
process, receive a callback and finally redirect and show the homepage again:

```
GET / 200 10.679 ms - 193
GET /auth/twitter 302 949.606 ms - 0
GET /auth/twitter/callback?oauth_token=...&oauth_verifier=... 302 1974.472 ms - 46
GET / 200 5.532 ms - 98
```

Happy hacking.

(Ends)
