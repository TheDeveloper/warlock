var Redis = require('redis');
var redis = module.exports = Redis.createClient();
var should  = require('should');
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

describe('lock', function () {
  it('should set a new lock if no lock exists', function (done) {
    warlock.lock('testLock', 1000, function (err, unlock) {
      should.not.exist(err);
      (typeof unlock).should.equal('string');
      done();
    });
  });

  it('should not set the lock if it already exists', function (done) {
    warlock.lock('testLock', 1000, function (err, unlock) {
      should.not.exist(err);
      unlock.should.equal(false);

      done();
    });
  });

  it('does not alter expiry of lock if it already exists', function (done) {
    redis.pttl(warlock.makeKey('testLock'), function (err, ttl) {
      warlock.lock('testLock', 1000, function (err, unlock) {
        should.not.exist(err);
        unlock.should.equal(false);
        redis.pttl(warlock.makeKey('testLock'), function (err, ttl2) {
          (ttl2 <= ttl).should.equal(true);
          done();
        });
      });
    });
  });
});

describe('unlock', function () {
  it('should release the lock', function (done) {
    warlock.lock('lockToRelease', 1000, function (err, id) {
      should.not.exist(err);
      warlock.unlock('lockToRelease', id, done);
    });
  });
});

// Test relock
describe('relock', function () {
  it('should increase the expiry time of an existing lock', function (done) {
    warlock.lock('testLock1', 2000, function (err, id) {
      redis.pttl(warlock.makeKey('testLock1'), function (err, ttl) {
        should.not.exist(err);
        warlock.relock('testLock1', id, 10000, function (err) {
          should.not.exist(err);
          redis.pttl(warlock.makeKey('testLock1'), function (err, ttl2) {
            (ttl2 > ttl).should.equal(true);
            done();
          });
        });
      });
    });
  });

  it('should not alter the expiry time of a non-existing lock', function (done) {
    // attempt to relock when no lock exists
    warlock.relock('testLock', '123', 1000, function (err, res) {
      should.not.exist(err);
      res.should.equal(0);

      done();
    });
  });

  it('should not alter the expiry time of a lock held by another process', function (done) {
    warlock.lock('testLock1', 2000, function (err) {
      should.not.exist(err);
      warlock.relock('testLock', '123', 1000, function (err, res) {
        should.not.exist(err);
        res.should.equal(0);
        done();
      });
    });
  });
});
