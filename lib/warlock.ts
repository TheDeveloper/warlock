import { RedisClient } from "redis";
import * as uuid from "uuid";
import AsyncRedis from 'async-redis';
import { createScript } from 'node-redis-script';

import { readFileSync } from 'fs';
import { resolve as resolvePath } from 'path';

const path = resolvePath(__dirname, './lua/parityDel.lua');
const parityDelSrc = readFileSync(path, 'utf8');

function createParityDel(redis: RedisClient) {
  const opts = { redis };
  return createScript(opts, parityDelSrc);
}
interface WarlockOpts {
  redis?: RedisClient
}
class Warlock {
  redis: RedisClient
  parityDel: any;

  constructor(opts: WarlockOpts = {}) {
    if (opts.redis) {
      this.redis = AsyncRedis.decorate(opts.redis);
    } else {
      this.redis = AsyncRedis.createClient();
    }

    this.parityDel = createParityDel(this.redis);
  }

  async lock(key: string, ttlMs: number) {
    const id = uuid.v4();
    const _key = `${key}:lock`;
    const result = await this.redis.set(_key, id, 'PX', ttlMs, 'NX');
    if (result) {
      const unlock = async () => {
        await this.unlock(key, id);
      }
      return unlock;
    }
    return false;
  }

  async unlock(key: string, id: string) {
    const numKeys = 1;
    const _key = `${key}:lock`;
    const result = await this.parityDel(numKeys, _key, id);
    return result;
  }
}
