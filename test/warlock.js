var should  = require('should');
var redis = require('./setup/redisConnection');
var warlock = require('../lib/warlock')(redis);
require('./setup/redisFlush');

describe('locking', function() {
  it('sets lock', function (done) {
    warlock.lock('testLock', 1000, function(err, unlock) {
      should.not.exist(err);
      (typeof unlock).should.equal('function');

      done();
    });
  });

  it('does not set lock if it already exists', function(done) {
    warlock.lock('testLock', 1000, function(err, unlock) {
      should.not.exist(err);
      unlock.should.equal(false);

      done();
    });
  });

  it('does not alter expiry of lock if it already exists', function(done) {
    redis.pttl(warlock.makeKey('testLock'), function(err, ttl) {
      warlock.lock('testLock', 1000, function(err, unlock) {
        should.not.exist(err);
        unlock.should.equal(false);

        redis.pttl(warlock.makeKey('testLock'), function(err, ttl2) {
          (ttl2 <= ttl).should.equal(true);

          done();
        });
      });
    });
  });

  it('unlocks', function(done) {
    warlock.lock('unlock', 1000, function(err, unlock) {
      should.not.exist(err);
      unlock(done);
    });
  });
});

describe('unlocking with id', function() {
  var lockId;

  it('sets lock and gets lock id', function(done) {
    warlock.lock('customlock', 20000, function(err, unlock, id) {
      should.not.exists(err);
      id.should.type("string");
      lockId = id;
      done();
    });
  });

  it('does not unlock with wrong id', function(done) {
    warlock.unlock('customlock', "wrongid", function(err, result) {
      should.not.exists(err);
      result.should.equal(0);
      done();
    });
  });

  it('unlocks', function(done) {
    warlock.unlock('customlock', lockId, function(err, result) {
      should.not.exists(err);
      result.should.equal(1);
      done();
    });
  });
});
