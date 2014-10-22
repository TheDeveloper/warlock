--
-- Extend the key if content is equal
-- This will extend the lock on the
--
-- KEYS[1]   - key
-- KEYS[2]   - content
-- KEYS[3]   - lock id
local key = KEYS[1]
local ttl = KEYS[2]
local id  = KEYS[3]

local value = redis.call('GET', key)

if value == id then
  return redis.call('SET', key, id, 'PX', ttl, 'XX');
else
  return 0
end
