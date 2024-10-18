const SpecReporter = require('jasmine-spec-reporter').SpecReporter;

// Set up jasmine
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
jasmine.getEnv().addReporter(new SpecReporter());

// Simulate Parse User class
const Parse = {
  User: class User {
    get(key) {
      switch (key) {
        case 'username':
          return 'ExampleUsername';
        case 'email':
          return 'to@example.com';
        case 'locale':
          return 'de-AT';
      }
    }
  }
};

module.exports = {
  Parse
};
