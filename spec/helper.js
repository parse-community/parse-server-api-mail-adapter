'use strict';

// Simluate Parse User class
const Parse = {
    User: class User {
        get(key) {
            switch (key) {
                case 'username':
                    return 'ExampleUsername'
                case 'email':
                    return 'to@example.com'
            }
        }
    }
};

module.exports = {
    Parse
};