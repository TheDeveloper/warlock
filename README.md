warlock
=======

Battle-hardened distributed locking using redis.

## Requirements

* [node-redis](https://github.com/mranney/node_redis) compatible with `v0.10`
* Redis `v2.6` or above

## Install

    npm install node-redis-warlock

## Usage

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

## ProTips

* Warlock uses Lua scripting to achieve transactional locking on Redis `v2.6.0` upwards. If you're running Redis `v2.6.12` or above you could use the additional PX and NX arguments for the [SET](http://redis.io/commands/set) operation as an alternative.
* Read my [Distributed locks using Redis](https://engineering.gosquared.com/distributed-locks-using-redis) article and Redis' author's [A proposal for more reliable locks using Redis](http://antirez.com/news/77) to learn more about the theory of distributed locks using Redis.
