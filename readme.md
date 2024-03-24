<p align="center"><img src="https://github.com/matthewmorek/blindfold/raw/master/public/img/og-image.png" alt="blindfold banner" /></p>

# Blindfold

_Blindfold_ is a small web app built in Node.js that allows you to turn off/on retweets from the people you follow on Twitter. Because life is too short to keep ingesting negative crap all the time.


## Getting started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.


### Prerequisites

What you’ll need to get started.

- Git
- NodeJS 16+
- `npm`


### Setting Up

1. Using Git, clone this repository to your local machine.
2. Run `npm install` or `yarn install` from inside the project's directory to install all dependencies.
3. Get your API Key and API Secret from https://developer.twitter.com.
    Ensure that you set the callback URL to both `http://127.0.0.1:3000/api/auth/callback` and `http://127.0.0.1:3001/api/auth/callback`.
4. Run `cp ./env.local.sample ./.env` and adjust config variables.
6. Run `npm install --force` to install dependencies.
7. Install Redis.


### Running

1. Start the Redis server locally.
2. On one terminal, run `npm run express` to start the backend.
3. On another terminal, run `npm run serve` to start Blindfold.


### Configuration

Blindfold has only a handful of options, but they are all required before Blindfold can run, otherwise expect it to complain.


### Deploying

To deploy, you only need to make sure to clone the repo, install dependencies, then run `yarn build` and make sure to point your proxy to the `./build` directory in order to serve the frontend properly.


### Contributing

This is a hobby project that most likely has bugs, untested things, and can likely fall on its head when mistreated. Feel free to report any issues, feature requests, etc.

If you spot something you can fix yourself, fork the repo, commit your code on a feature branch and open a pull request.

**I will happily review all contributions, especially those that help with establishing testing of Blindfold.**


#### Notice

Blindfold was never meant to be yet another Twitter client of any kind, so don't expect me to add new features such as feeds, lists, etc.

---

&copy; Matthew Morek
