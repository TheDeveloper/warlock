const should = require('should');
const Redis = require('redis');

const redis = Redis.createClient({ port: 6386 });
const warlock = require('../lib/warlock')(redis);

describe('locking', () => {
  it('sets lock', (done) => {
    warlock.lock('testLock', 1000, (err, unlock) => {
      should.not.exist(err);
      (typeof unlock).should.equal('function');
      done();
    });
  });

  it('does not set lock if it already exists', (done) => {
    warlock.lock('testLock', 1000, (err, unlock) => {
      should.not.exist(err);
      unlock.should.equal(false);

      done();
    });
  });

  it('does not alter expiry of lock if it already exists', (done) => {
    redis.pttl(warlock.makeKey('testLock'), (err, ttl) => {
      warlock.lock('testLock', 1000, (err, unlock) => {
        should.not.exist(err);
        unlock.should.equal(false);

        redis.pttl(warlock.makeKey('testLock'), (err, ttl2) => {
          (ttl2 <= ttl).should.equal(true);

          done();
        });
      });
    });
  });

  it('unlocks', (done) => {
    warlock.lock('unlock', 1000, (err, unlock) => {
      should.not.exist(err);
      unlock(done);
    });
  });
});

describe('unlocking with id', () => {
  let lockId;

  it('sets lock and gets lock id', (done) => {
    warlock.lock('customlock', 20000, (err, unlock, id) => {
      should.not.exists(err);
      id.should.type('string');
      lockId = id;
      done();
    });
  });

  it('does not unlock with wrong id', (done) => {
    warlock.unlock('customlock', 'wrongid', (err, result) => {
      should.not.exists(err);
      result.should.equal(0);
      done();
    });
  });

  it('unlocks', (done) => {
    warlock.unlock('customlock', lockId, (err, result) => {
      should.not.exists(err);
      result.should.equal(1);
      done();
    });
  });
});

describe('touching a lock', function() {
  var key = 'touchlock'
    , lockId;

  it('sets lock and gets lock id', function(done) {
    warlock.lock(key, 1000, function(err, unlock, id) {
      should.not.exists(err);
      id.should.type("string");
      lockId = id;
      done();
    });
  });

  it('alters expiry of the lock', function(done) {
    redis.pttl(warlock.makeKey(key), function(err, ttl) {
      warlock.touch(key, lockId, 2000, function(err) {
        should.not.exist(err);
        redis.pttl(warlock.makeKey(key), function(err, ttl2) {
          (ttl2 > ttl).should.equal(true);
          done();
        });
      });
    });
  });

  it('unlocks', function(done) {
    warlock.unlock(key, lockId, function(err, result) {
      should.not.exists(err);
      result.should.equal(1);
      done();
    });
  });
});