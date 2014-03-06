RUNNER ?= ./node_modules/mocha/bin/mocha
REPORTER ?= list

run = $(RUNNER) -R $(REPORTER) $(2) $(1)

test:
	$(call run,./test/warlock.js)

.PHONY: test
