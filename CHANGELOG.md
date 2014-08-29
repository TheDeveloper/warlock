Changelog
---

# v0.1.0

* Key generator no longer md5's the key. Instead appends a ':lock' string to the original key. To override, set `warlock.makeKey` to your own function.
* Lock ownership check uses `uuid.v1` value.
* Bump Redis requirement to `v2.6.12`.
* Using additional Redis SET arguments to set lock key instead of script.
* Add `warlock.optimistic` method.
