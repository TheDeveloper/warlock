warlock
=======

Battle-hardened distributed locking using redis.

# Usage

```javascript

var Warlock = require('node-redis-warlock');
var redis = require('redis');

// Establish a redis client and pass it to warlock
var redis = redis.createClient();
var warlock = Warlock(redis);

// Set a lock

var key = 'test-lock';
var ttl = 10000;

warlock.lock(key, ttl, function(err, unlock){
  if (err) {
    // Something went wrong and we weren't able to set a lock
    return;
  }

  if (typeof unlock === 'function') {
    // If the lock is set successfully by this process, an unlock function is passed to our callback.
    // Do the work that required lock protection, and then unlock() when finished...
    //
    // do stuff...
    //
    unlock();
  } else {
    // Otherwise, the lock was not established by us so we must decide what to do
    // Perhaps wait a bit & retry...
  }
});

```
