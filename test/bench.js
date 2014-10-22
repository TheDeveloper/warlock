var async = require('async');
var Redis = require('redis');
var redis = module.exports = Redis.createClient();
var warlock = require('../lib/warlock')(redis);

before(function (done) {
  this.redis = redis;
  if (redis.connected) {
    return done();
  } else {
    redis.on('ready', done);
  }
});

beforeEach(function (done) {
  this.redis.script('flush', done);
});

describe('benchmark', function () {
  it('lock', function (done) {
    var start = Date.now();
    async.times(
      10000,
      function (n, cb) {
        warlock.lock('' + Math.random(), 10000, cb);
      },
      function (err) {
        if (err) {
          console.trace(err);
        }

        var end = Date.now();
        var delta = end - start;
        console.log(delta);
        done();
      });
  });
});

