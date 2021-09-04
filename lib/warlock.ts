import { RedisClient } from "redis";
import * as uuid from "uuid";
import AsyncRedis from 'async-redis';
import { createScript } from 'node-redis-script';
import Redis from 'redis';

import { readFileSync } from 'fs';
import { resolve as resolvePath } from 'path';

function createParityDel(redis: RedisClient) {
  const path = resolvePath(__dirname, '../../lib/lua/parityDel.lua');
  const parityDelSrc = readFileSync(path, 'utf8');
  const opts = { redis };
  return createScript(opts, parityDelSrc);
}

function createParityRelock(redis: RedisClient) {
  const path = resolvePath(__dirname, '../../lib/lua/parityRelock.lua');
  const parityRelockSrc = readFileSync(path, 'utf8');
  const opts = { redis };
  return createScript(opts, parityRelockSrc);
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
interface WarlockOpts {
  redis?: RedisClient
}
export class Warlock {
  redis: RedisClient
  parityDel: any;
  parityRelock: any;

  constructor(opts: WarlockOpts = {}) {
    let redis = opts.redis;
    if (!redis) redis = Redis.createClient();

    this.parityDel = createParityDel(redis);
    this.parityRelock = createParityRelock(redis);

    this.redis = AsyncRedis.decorate(redis);
  }

  async lock(key: string, ttlMs: number) {
    const id = uuid.v4();
    const _key = `${key}:lock`;
    const result = await this.redis.set(_key, id, 'PX', ttlMs, 'NX');
    if (result) {
      const unlock = () => this.unlock(key, id);
      return unlock;
    }
    return false;
  }

  async unlock(key: string, id: string): Promise<0|1> {
    const numKeys = 1;
    const _key = `${key}:lock`;
    const result = await this.parityDel(numKeys, _key, id);
    return result;
  }

  async optimistic(
    key: string,
    ttlMs: number,
    maxAttempts: number,
    waitMs: number
  ) {
    let attempts = 0;
    let unlock;

    while (!unlock && attempts < maxAttempts) {
      if (attempts > 0) await wait(waitMs);
      unlock = await this.lock(key, ttlMs);
      attempts += 1;
    }

    return unlock;
  }

  async touch(key: string, id: string, ttlMs: number) {
    const _key = `${key}:lock`;
    const result = await this.parityRelock(1, _key, ttlMs, id);
    return result;
  }
}
