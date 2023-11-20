# `is-on-water`

💧 Check whether a geographic coordinate is on water (seas, lakes, and rivers) with 1m precision. Exposed via an HTTP API allowing for single coordinate (`GET /api/is-on-water?lat=${lat}&lon=${lon}`) and batches (`POST /api/is-on-water` with array of coordinate objects) lookups.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/MfUYQX?referralCode=ToZEjF)

## Installation

```sh
git clone https://github.com/dillonstreator/is-on-water

cd is-on-water

yarn install

## run in development with hot-reload
yarn dev

## OR build and run
yarn build && yarn start
```

It is expected that [Redis](https://redis.io/) is running. You can specify the redis connection url with the environment variable `REDIS_URL`.
