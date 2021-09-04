--
-- Extend the key if content is equal
--
local key = KEYS[1]
local ttl = ARGV[1]
local id  = ARGV[2]

local value = redis.call('GET', key)

if value == id then
  return redis.call('SET', key, id, 'PX', ttl, 'XX');
else
  return 0
end
