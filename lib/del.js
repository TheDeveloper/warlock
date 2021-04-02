const path = require('path');
const _path = path.resolve(__dirname, './lua/parityDel.lua');
const src = require('fs').readFileSync(_path, { encoding: 'utf-8' });
const { createScript } = require('node-redis-script');

exports.createScript = redis => {
  const opts = { redis };
  return createScript(opts, src);
}
