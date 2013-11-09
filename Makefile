# TESTS

TESTER = ./node_modules/.bin/mocha
OPTS = --growl --ignore-leaks --timeout 40000
TESTS = test/*.test.js
INTEGRATION = test/*.integration.js
JSHINT = ./node_modules/.bin/jshint

JS_FILES = $(shell find . -type f -name "*.js" \
					 -not -path "./node_modules/*" -and \
					 -not -path "./lib/shopper/*" -and \
					 -not -path "./coverage/*" -and \
					 -not -path "./config/database.js" -and \
					 -not -path "./db/schema.js")

check:
	@$(JSHINT) $(JS_FILES)

test:
	$(TESTER) $(OPTS) $(TESTS)
test-verbose:
	$(TESTER) $(OPTS) --reporter spec $(TESTS)
test-integration:
	$(TESTER) $(OPTS) --reporter spec $(INTEGRATION)
test-full:
	$(TESTER) $(OPTS) --reporter spec $(TESTS) $(INTEGRATION)
testing:
	$(TESTER) $(OPTS) --watch $(TESTS)

.PHONY: test doc docs
