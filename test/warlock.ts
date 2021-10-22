import should from 'should';
import { createClient } from 'redis';

const redis = createClient(6386);
import { Warlock } from '../lib/warlock';

const opts = { redis };
const warlock = new Warlock(opts);

describe('locking', () => {
  it('sets lock', async () => {
    const unlock = await warlock.lock('testLock', 1000);
    (typeof unlock).should.equal('function');
  });

  it('does not set lock if it already exists', async () => {
    const unlock = await warlock.lock('testLock', 1000);
    unlock.should.equal(false);
  });

  it('does not alter expiry of lock if it already exists', async () => {
    const key = 'testLock';
    const _key = `${key}:lock`;
    const ttl = await redis.pttl(_key);
    const ttlMs = 1000;
    const unlock = await warlock.lock(key, ttlMs);
    unlock.should.equal(false);
    const ttl2 = await redis.pttl(_key);
    (ttl2 <= ttl).should.equal(true);
  });

  it('unlocks', async () => {
    const ttlMs = 1000;
    const key = 'testUnlock';
    const unlock = await warlock.lock(key, ttlMs);
    if (!unlock) return unlock.should.not.equal(false);
    const result = await unlock();
    result.should.equal(1);
  });
});

describe('unlocking with incorrect id', () => {
  it('denies unlock', async () => {
    const ttlMs = 10000;
    const key = 'unlockTest';
    await warlock.lock(key, ttlMs);
    const id = 'test123';
    const result = await warlock.unlock(key, id);
    result.should.equal(0);
  });
})

describe.skip('touching a lock', () => {
  const key = 'touchlock';
  let lockId;

  it('sets lock and gets lock id', (done) => {
    warlock.lock(key, 1000, (err, unlock, id) => {
      should.not.exists(err);
      id.should.type('string');
      lockId = id;
      done();
    });
  });

  it('alters expiry of the lock', (done) => {
    redis.pttl(warlock.makeKey(key), (err, ttl) => {
      warlock.touch(key, lockId, 2000, (err) => {
        should.not.exist(err);
        redis.pttl(warlock.makeKey(key), (err, ttl2) => {
          (ttl2 > ttl).should.equal(true);
          done();
        });
      });
    });
  });

  it('unlocks', (done) => {
    warlock.unlock(key, lockId, (err, result) => {
      should.not.exists(err);
      result.should.equal(1);
      done();
    });
  });
});
