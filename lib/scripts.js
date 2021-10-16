const fs = require('fs');
const path = require('path');
const { createScript } = require('node-redis-script');

function readRedisScript(scriptName) {
  const filepath = path.resolve(__dirname, `./lua/${scriptName}.lua`);
  const src = fs.readFileSync(filepath, { encoding: 'utf-8' });
  return src;
}

const RedisScript = (scriptName) => {
  const src = readRedisScript(scriptName);
  return (redis) => createScript({ redis }, src);
}

module.exports.ParityDel = RedisScript('parityDel');
module.exports.ParityRelock = RedisScript('parityRelock');
