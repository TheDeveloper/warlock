const UUID = require('uuid');
const { ParityDel, ParityRelock } = require('./scripts');

module.exports = function (redis) {
  const warlock = {};

  const parityDel = ParityDel(redis);
  const parityRelock = ParityRelock(redis);

  warlock.makeKey = function (key) {
    return `${key}:lock`;
  };

  /**
   * Set a lock key
   * @param {string}   key    Name for the lock key. String please.
   * @param {integer}  ttl    Time in milliseconds for the lock to live.
   * @param {Function} cb
   */
  warlock.lock = function (key, ttl, cb) {
    cb = cb || function () {};

    if (typeof key !== 'string') {
      return cb(new Error('lock key must be string'));
    }

    let id;
    UUID.v1(null, (id = new Buffer(16)));
    id = id.toString('base64');
    redis.set(
      warlock.makeKey(key), id,
      'PX', ttl, 'NX',
      (err, lockSet) => {
        if (err) return cb(err);

        const unlock = lockSet ? warlock.unlock.bind(warlock, key, id) : false;
        return cb(err, unlock, id);
      },
    );

    return key;
  };

  warlock.unlock = async (key, id, cb) => {
    cb = cb || function () {};

    if (typeof key !== 'string') {
      return cb(new Error('lock key must be string'));
    }

    const numKeys = 1;
    const _key = warlock.makeKey(key);
    try {
      const result = await parityDel(numKeys, _key, id);
      cb(null, result);
    } catch (e) {
      cb(e);
    }
  };

  /**
   * Set a lock optimistically (retries until reaching maxAttempts).
   */
  warlock.optimistic = function (key, ttl, maxAttempts, wait, cb) {
    let attempts = 0;

    var tryLock = function () {
      attempts += 1;
      warlock.lock(key, ttl, (err, unlock) => {
        if (err) return cb(err);

        if (typeof unlock !== 'function') {
          if (attempts >= maxAttempts) {
            const e = new Error('unable to obtain lock');
            e.maxAttempts = maxAttempts;
            e.key = key;
            e.ttl = ttl;
            e.wait = wait;
            return cb(e);
          }
          return setTimeout(tryLock, wait);
        }

        return cb(err, unlock);
      });
    };

    tryLock();
  };

  warlock.touch = async (key, id, ttl, cb) => {
    if (typeof key !== 'string') {
      const e = new Error('lock key must be string');
      e.id = id;
      e.key = key;
      e.ttl = ttl;
      if (!cb) throw e;
      return cb(e);
    }

    try {
      const result = await parityRelock(3, warlock.makeKey(key), ttl, id);
      return cb ? cb(null, result) : result;
    } catch (e) {
      if (!cb) throw e;
      return cb(e);
    }
  };

  return warlock;
};
