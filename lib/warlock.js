var crypto       = require('crypto');
var Scripty      = require('node-redis-scripty');

var scripty;

module.exports = function(redis){
  var warlock = {};

  scripty = new Scripty(redis);

  warlock.makeKey = function(key) {
    return 'lock:' + crypto.createHash('md5').update(key).digest('hex').substr(0, 10);
  };

  /**
   * Set a lock key
   * @param {string}   key    Name for the lock key. String please.
   * @param {integer}  ttl    Time in milliseconds for the lock to live.
   * @param {Function} cb
   */
  warlock.lock = function(key, ttl, cb) {
    cb = cb || function(){};

    if (typeof key !== 'string') return cb('lock key must be string');

    scripty.loadScriptFile('lock', __dirname + '/lua/lock.lua', function(err, lock){
      if (err) return cb(err);

      var timestamp = Date.now();
      lock.run(3, warlock.makeKey(key), ttl, timestamp, function(err, lockSet) {
        if (err) return cb(err);

        var unlock = warlock.unlock.bind(warlock, key, timestamp);

        if (!lockSet) unlock = false;

        return cb(err, unlock);
      });
    });

    return key;
  };

  warlock.unlock = function(key, timestamp, cb) {
    cb = cb || function(){};

    if (typeof key !== 'string') return cb('lock key must be string');

    scripty.loadScriptFile('parityDel', __dirname + '/lua/parityDel.lua', function(err, parityDel){
      if (err) return cb(err);

      return parityDel.run(2, warlock.makeKey(key), timestamp, cb);
    });
  };

  return warlock;
};
