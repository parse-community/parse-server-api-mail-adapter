'use strict';

const MailAdapter = require('../src/MailAdapter');
const { Parse } = require('./helper');

describe('MailAdapter', () => {
  const adapter = new MailAdapter()
  const user = new Parse.User();

  it('should have a method called sendMail', () => {
    expect(typeof adapter.sendMail).toBe('function');
    expect(adapter.sendMail()).toBeUndefined();
  });

  it('should have a method called sendVerificationEmail', () => {
    expect(typeof adapter.sendVerificationEmail).toBe('function');
    expect(adapter.sendVerificationEmail({ link: 'link', appName: 'appName', user: user, external: true })).toBeUndefined();
  });

  it('should have a method called sendPasswordResetEmail', () => {
    expect(typeof adapter.sendPasswordResetEmail).toBe('function');
    expect(adapter.sendPasswordResetEmail({ link: 'link', appName: 'appName', user: user, external: true })).toBeUndefined();
  });
});
