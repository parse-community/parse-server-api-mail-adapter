'use strict';

const path = require('path');
const fs = require('fs').promises;
const ApiMailAdapter = require('../src/ApiMailAdapter');
const ApiPayloadConverter = require('../src/ApiPayloadConverter');
const Errors = require('../src/Errors');
const { Parse } = require('./helper');

const user = new Parse.User();
const link = 'http://example.com';
const appName = 'ExampleApp';
const apiResponseSuccess = async () => "Success";
const config = {
  apiCallback: apiResponseSuccess,
  sender: 'from@example.com',
  templates: {
    passwordResetEmail: {
      subjectPath: path.join(__dirname, 'templates/password_reset_email_subject.txt'),
      textPath: path.join(__dirname, 'templates/password_reset_email.txt'),
      htmlPath: path.join(__dirname, 'templates/password_reset_email.html'),
    },
    verificationEmail: {
      subjectPath: path.join(__dirname, 'templates/verification_email_subject.txt'),
      textPath: path.join(__dirname, 'templates/verification_email.txt'),
      htmlPath: path.join(__dirname, 'templates/verification_email.html'),
      placeholderCallback: () => {},
    },
    customEmail: {
      subjectPath: path.join(__dirname, 'templates/custom_email_subject.txt'),
      textPath: path.join(__dirname, 'templates/custom_email.txt'),
      htmlPath: path.join(__dirname, 'templates/custom_email.html'),
      extra: {
        replyTo: 'replyto@example.com',
      },
    },
    customEmailWithPlaceholderCallback: {
      subjectPath: path.join(__dirname, 'templates/custom_email_subject.txt'),
      textPath: path.join(__dirname, 'templates/custom_email.txt'),
      htmlPath: path.join(__dirname, 'templates/custom_email.html'),
      placeholders: {
        appName: "TemplatePlaceholder"
      },
      placeholderCallback: () => new Promise((resolve) => {
        resolve({
          appName: 'CallbackPlaceholder'
        });
      })
    },
    customEmailWithLocaleCallback: {
      subjectPath: path.join(__dirname, 'templates/custom_email_subject.txt'),
      textPath: path.join(__dirname, 'templates/custom_email.txt'),
      htmlPath: path.join(__dirname, 'templates/custom_email.html'),
      localeCallback: async () => { return 'de-AT'; }
    },
    customEmailWithPlaceholderCallbackAndLocaleCallback: {
      subjectPath: path.join(__dirname, 'templates/custom_email_subject.txt'),
      textPath: path.join(__dirname, 'templates/custom_email.txt'),
      htmlPath: path.join(__dirname, 'templates/custom_email.html'),
      placeholders: {
        appName: "TemplatePlaceholder"
      },
      placeholderCallback: () => new Promise((resolve) => {
        resolve({
          appName: 'CallbackPlaceholder'
        });
      }),
      localeCallback: async () => { return 'de-AT'; }
    },
  }
};
const examplePayload = {
  from: "from@example.com",
  to: "to@example.com",
  replyTo: "replyto@example.com",
  subject: "ExampleSubject",
  text: "ExampleText",
  html: "ExampleHtml"
}

describe('ApiMailAdapter', () => {
  const ds = 'dummy string';
  const df = () => "dummy function";

  describe('initialization', function () {
    function adapter (config) {
      return (() => new ApiMailAdapter(config)).bind(null);
    }

    it('fails with invalid configuration', async () => {
      const configs = [
        undefined,
        null,
        {},
      ];
      for (const config of configs) {
        expect(adapter(config)).toThrow(Errors.Error.configurationInvalid);
      }
    });

    it('fails with invalid templates', async () => {
      const configs = [
        { apiCallback: df, sender: ds },
        { apiCallback: df, sender: ds, templates: {} },
        { apiCallback: df, sender: ds, templates: [] },
      ];
      for (const config of configs) {
        expect(adapter(config)).toThrow(Errors.Error.templatesInvalid);
      }
    });

    it('fails with invalid template content path', async () => {
      const configs = [
        { apiCallback: df, sender: ds, templates: { customEmail: {} } },
        { apiCallback: df, sender: ds, templates: { customEmail: { subjectPath: ds } } },
        { apiCallback: df, sender: ds, templates: { customEmail: { textPath: ds } } },
        { apiCallback: df, sender: ds, templates: { customEmail: { subjectPath: ds, textPath: 1 } } },
        { apiCallback: df, sender: ds, templates: { customEmail: { subjectPath: 1, textPath: ds } } },
        { apiCallback: df, sender: ds, templates: { customEmail: { subjectPath: ds, textPath: ds, htmlPath: 1 } } }
      ];
      for (const config of configs) {
        expect(adapter(config)).toThrow(Errors.Error.templateContentPathInvalid);
      }
    });

    it('fails with invalid placeholder callback', async () => {
      const configs = [
        { apiCallback: df, sender: ds, templates: { customEmail: { subjectPath: ds, textPath: ds, placeholderCallback: {} } } },
        { apiCallback: df, sender: ds, templates: { customEmail: { subjectPath: ds, textPath: ds, placeholderCallback: ds } } }
      ];
      for (const config of configs) {
        expect(adapter(config)).toThrow(Errors.Error.templateCallbackNoFunction);
      }
    });

    it('fails with missing or invalid API callback', async () => {
      const configs = [
        { sender: ds, templates: { customEmail: { subjectPath: ds, textPath: ds } } },
        { apiCallback: null, sender: ds, templates: { customEmail: { subjectPath: ds, textPath: ds } } },
        { apiCallback: true, sender: ds, templates: { customEmail: { subjectPath: ds, textPath: ds } } },
        { apiCallback: ds, sender: ds, templates: { customEmail: { subjectPath: ds, textPath: ds } } },
      ];
      for (const config of configs) {
        expect(adapter(config)).toThrow(Errors.Error.apiCallbackNoFunction);
      }
    });

    it('fails with invalid locale callback', async () => {
      const configs = [
        { apiCallback: df, sender: ds, templates: { customEmail: { subjectPath: ds, textPath: ds, localeCallback: ds } } },
        { apiCallback: df, sender: ds, templates: { customEmail: { subjectPath: ds, textPath: ds, localeCallback: true } } },
        { apiCallback: df, sender: ds, templates: { customEmail: { subjectPath: ds, textPath: ds, localeCallback: [] } } },
      ];
      for (const config of configs) {
        expect(adapter(config)).toThrow(Errors.Error.localeCallbackNoFunction);
      }
    });

    it('succeeds with valid configuration', async () => {
      const configs = [
        { apiCallback: df, sender: ds, templates: { customEmail: { subjectPath: ds, textPath: ds } } },
        { apiCallback: df, sender: ds, templates: { customEmail: { subjectPath: ds, textPath: ds, placeholderCallback: df } } }
      ];
      for (const config of configs) {
        expect(adapter(config)()).toBeInstanceOf(ApiMailAdapter);
      }
    });
  });

  describe('send password reset email', function () {

    it('returns promise', async () => {
      const adapter = new ApiMailAdapter(config);
      const options = { link, appName, user };

      const promise = adapter.sendPasswordResetEmail(options);
      expect(promise).toBeInstanceOf(Promise);
    });

    it('invokes API callback with correct arguments', async () => {
      const adapter = new ApiMailAdapter(config);
      const _sendMail = spyOn(ApiMailAdapter.prototype, '_sendMail').and.callThrough();
      const apiCallback = spyOn(adapter, 'apiCallback').and.callThrough();
      const templateName = 'passwordResetEmail';
      const options = { link, appName, user };
      const expectedArguments = { templateName, link, appName, user };

      await adapter.sendPasswordResetEmail(options);
      expect(_sendMail.calls.all()[0].args[0]).toEqual(expectedArguments);
      expect(apiCallback.calls.all()[0].args[0].payload.from).toEqual(config.sender);
      expect(apiCallback.calls.all()[0].args[0].payload.to).toEqual(user.get('email'));
      expect(apiCallback.calls.all()[0].args[0].payload.subject).toMatch("Reset");
      expect(apiCallback.calls.all()[0].args[0].payload.text).toMatch("reset");
      expect(apiCallback.calls.all()[0].args[0].payload.html).toMatch("reset");
    });
  });

  describe('send verification email', function () {

    it('returns promise', async () => {
      const adapter = new ApiMailAdapter(config);
      const options = { link, appName, user };

      const promise = adapter.sendVerificationEmail(options);
      expect(promise).toBeInstanceOf(Promise);
    });

    it('invokes API callback with correct arguments', async () => {
      const adapter = new ApiMailAdapter(config);
      const _sendMail = spyOn(ApiMailAdapter.prototype, '_sendMail').and.callThrough();
      const apiCallback = spyOn(adapter, 'apiCallback').and.callThrough();
      const templateName = 'verificationEmail';
      const options = { link, appName, user };
      const expectedArguments = { templateName, link, appName, user };

      await adapter.sendVerificationEmail(options);
      expect(_sendMail.calls.all()[0].args[0]).toEqual(expectedArguments);
      expect(apiCallback.calls.all()[0].args[0].payload.from).toEqual(config.sender);
      expect(apiCallback.calls.all()[0].args[0].payload.to).toEqual(user.get('email'));
      expect(apiCallback.calls.all()[0].args[0].payload.subject).toMatch("Verification");
      expect(apiCallback.calls.all()[0].args[0].payload.text).toMatch("verify");
      expect(apiCallback.calls.all()[0].args[0].payload.html).toMatch("verify");
    });
  });

  describe('send generic email', function () {

    it('invokes _sendMail() with correct arguments', async () => {
      const adapter = new ApiMailAdapter(config);
      spyOn(adapter, 'apiCallback').and.callFake(apiResponseSuccess);
      const _sendMail = spyOn(ApiMailAdapter.prototype, '_sendMail').and.callThrough();
      const options = {
        sender: config.sender,
        recipient: 'to@example.com',
        subject: 'ExampleSubject',
        text: 'ExampleText',
        html: 'ExampleHtml',
        templateName: 'customEmail',
        placeholders: {
          appName: 'ExampleApp',
          username: 'ExampleUser'
        },
        extra: {
          field: "ExampleExtra"
        },
        user: undefined,
      };
      const expectedArguments = Object.assign({}, options, { direct: true });

      await expectAsync(adapter.sendMail(options)).toBeResolved();
      expect(_sendMail.calls.all()[0].args[0]).toEqual(expectedArguments);
    });

    it('allows sendMail() without using a template', async () => {
      const adapter = new ApiMailAdapter(config);
      const apiCallbackSpy = spyOn(adapter, 'apiCallback').and.callFake(apiResponseSuccess);
      const options = {
        sender: config.sender,
        recipient: 'to@example.com',
        subject: 'ExampleSubject',
        text: 'ExampleText',
        html: 'ExampleHtml',
      };

      await expectAsync(adapter.sendMail(options)).toBeResolved();
      const apiPayload = apiCallbackSpy.calls.all()[0].args[0].payload;
      expect(apiPayload.from).toEqual(options.sender);
      expect(apiPayload.to).toEqual(options.recipient);
      expect(apiPayload.subject).toEqual(options.subject);
      expect(apiPayload.text).toEqual(options.text);
      expect(apiPayload.html).toEqual(options.html);
    });

    it('passes user to callback when user is passed to sendMail()', async () => {
      const adapter = new ApiMailAdapter(config);
      const localeCallbackSpy = spyOn(config.templates.customEmailWithLocaleCallback, 'localeCallback').and.callThrough();
      const options = {
        templateName: 'customEmailWithLocaleCallback',
        user: new Parse.User(),
      };

      await expectAsync(adapter.sendMail(options)).toBeResolved();
      expect(localeCallbackSpy.calls.all()[0].args[0].get('locale')).toBe(options.user.get('locale'));
    });

    it('uses user email if no recipient is passed to sendMail()', async () => {
      const adapter = new ApiMailAdapter(config);
      const apiCallbackSpy = spyOn(adapter, 'apiCallback').and.callThrough();
      const options = {
        templateName: 'customEmailWithLocaleCallback',
        user: new Parse.User(),
      };

      await expectAsync(adapter.sendMail(options)).toBeResolved();
      expect(apiCallbackSpy.calls.all()[0].args[0].payload.to).toBe(options.user.get('email'));
    });

    it('overrides user email if recipient is passed to sendMail()', async () => {
      const adapter = new ApiMailAdapter(config);
      const apiCallbackSpy = spyOn(adapter, 'apiCallback').and.callThrough();
      const options = {
        recipient: 'override@example.com',
        templateName: 'customEmailWithLocaleCallback',
        user: new Parse.User(),
      };

      await expectAsync(adapter.sendMail(options)).toBeResolved();
      expect(apiCallbackSpy.calls.all()[0].args[0].payload.to).toBe(options.recipient);
    });
  });

  describe('generate API payload', function () {

    it('creates payload with correct properties', async () => {
      const adapter = new ApiMailAdapter(config);
      spyOn(adapter, 'apiCallback').and.callFake(apiResponseSuccess);
      const _createApiData = spyOn(adapter, '_createApiData').and.callThrough();
      const options = {
        sender: config.sender,
        recipient: 'to@example.com',
        subject: 'ExampleSubject',
        text: 'ExampleText',
        html: 'ExampleHtml',
        templateName: 'customEmail',
        placeholders: {
          appName: 'ExampleApp',
          username: 'ExampleUser'
        },
        extra: {
          field: "ExampleExtra"
        }
      };

      await expectAsync(adapter.sendMail(options)).toBeResolved();

      const { payload } = (await _createApiData.calls.all()[0].returnValue);
      expect(payload.from).toMatch(options.sender);
      expect(payload.to).toMatch(options.recipient);
      expect(payload.subject).toMatch(options.subject);
      expect(payload.text).toMatch(options.text);
      expect(payload.html).toMatch(options.html);
      expect(payload.replyTo).toMatch(config.templates[options.templateName].extra.replyTo);
    });

    it('creates payload with correct properties when overriding extras', async () => {
      const adapter = new ApiMailAdapter(config);
      spyOn(adapter, 'apiCallback').and.callFake(apiResponseSuccess);
      const _createApiData = spyOn(adapter, '_createApiData').and.callThrough();
      const options = {
        sender: config.sender,
        recipient: 'to@example.com',
        subject: 'ExampleSubject',
        text: 'ExampleText',
        html: 'ExampleHtml',
        templateName: 'customEmail',
        placeholders: {
          appName: 'ExampleApp',
          username: 'ExampleUser'
        },
        extra: {
          replyTo: "override@example.com"
        }
      };

      await expectAsync(adapter.sendMail(options)).toBeResolved();

      const { payload } = (await _createApiData.calls.all()[0].returnValue);
      expect(payload.from).toMatch(options.sender);
      expect(payload.to).toMatch(options.recipient);
      expect(payload.subject).toMatch(options.subject);
      expect(payload.text).toMatch(options.text);
      expect(payload.html).toMatch(options.html);
      expect(payload.replyTo).not.toMatch(config.templates[options.templateName].extra.replyTo);
      expect(payload.replyTo).toMatch(options.extra.replyTo);
    });
  });

  describe('convert API payload', () => {
    const adapter = new ApiMailAdapter(config);
    const converter = ApiPayloadConverter;

    beforeEach(() => {
      spyOn(adapter, 'apiCallback').and.callFake(apiResponseSuccess);
    });

    it('converts payload for Mailgun', () => {
      const payload = converter.mailgun(examplePayload);
      expect(payload.from).toBe(examplePayload.from);
      expect(payload.to).toBe(examplePayload.to);
      expect(payload['h:Reply-To']).toBe(examplePayload.replyTo);
      expect(payload.subject).toBe(examplePayload.subject);
      expect(payload.text).toBe(examplePayload.text);
      expect(payload.html).toBe(examplePayload.html);
    });

    it('converts payload for AWS SES (SDK v3)', () => {
      const payload = converter.awsSes(examplePayload);
      expect(payload.Source).toEqual([examplePayload.from]);
      expect(payload.Destination.ToAddresses).toEqual([examplePayload.to]);
      expect(payload.ReplyToAddresses).toEqual([examplePayload.replyTo]);
      expect(payload.Message.Subject.Data).toBe(examplePayload.subject);
      expect(payload.Message.Body.Text.Data).toBe(examplePayload.text);
      expect(payload.Message.Body.Html.Data).toBe(examplePayload.html);
    });

    it('converts payload for ZeptoMail for single recepient', () => {
      //test works for ZeptoMail v1.1 which is current version

      const payload = converter.zeptomail({api: '1.1',originalPayload: examplePayload});
      expect(payload.from.address).toEqual(examplePayload.from);
      // Check if 'to' is an array
      expect(payload.to).toBeInstanceOf(Array);    
      // Check if the array has at least one element
      expect(payload.to.length).toBe(1);
      expect(payload.to[0].email_address.address).toEqual(examplePayload.to);

      // Check if 'to' is an array
      expect(payload.reply_to).toBeInstanceOf(Array);

      // Check if the array has at least one element
      expect(payload.reply_to.length).toBe(1);   
      expect(payload.reply_to[0].address).toEqual(examplePayload.replyTo);
      expect(payload.subject).toBe(examplePayload.subject);
      expect(payload.textbody).toBe(examplePayload.text);
      expect(payload.htmlbody).toBe(examplePayload.html);
    });

    it('converts payload for ZeptoMail for multiple recepients', () => {
      //test works for ZeptoMail v1.1 which is current version
      const multipleRecepientExamplePayload = {
        from: "from@example.com",
        to: "to@example.com,toanother@example.com",
        replyTo: "replyto@example.com, replytoanother@example.com",
        subject: "ExampleSubject",
        text: "ExampleText",
        html: "ExampleHtml"
      }

      const payload = converter.zeptomail({api: '1.1',originalPayload: multipleRecepientExamplePayload});

      expect(payload.from.address).toEqual(multipleRecepientExamplePayload.from);

      // Check if 'to' is an array
      expect(payload.to).toBeInstanceOf(Array);    
      //test multiple to addresses
      const toAddresses = payload.to.map(entry => entry.email_address.address);
      payload.to.forEach((entry, index) => {
        
        expect(entry.email_address.address).toBe(toAddresses[index]);

      });

      // Check if 'reply_to' is an array
      expect(payload.reply_to).toBeInstanceOf(Array);
      //test multiple to addresses
      const replyToAddresses = payload.reply_to[0].address.split(',').map(addr => addr.trim());
      const [firstAddress, secondAddress] = replyToAddresses;
      expect(replyToAddresses).toContain(firstAddress);
      expect(replyToAddresses).toContain(secondAddress);

      expect(payload.subject).toBe(multipleRecepientExamplePayload.subject);
      expect(payload.textbody).toBe(multipleRecepientExamplePayload.text);
      expect(payload.htmlbody).toBe(multipleRecepientExamplePayload.html);
    });

  });

  describe('invoke _sendMail', function () {

    it('throws if template name is missing', async () => {
      const adapter = new ApiMailAdapter(config);
      await expectAsync(adapter._sendMail({})).toBeRejectedWith(Errors.Error.templateConfigurationNoName);
    });

    it('throws if template name does not exist', async () => {
      const adapter = new ApiMailAdapter(config);
      const configs = [
        { templateName: 'invalid' },
      ];
      for (const config of configs) {
        await expectAsync(adapter._sendMail(config)).toBeRejectedWith(Errors.Error.noTemplateWithName('invalid'));
      }
    });

    it('throws if recipient is not set', async () => {
      const adapter = new ApiMailAdapter(config);
      await expectAsync(adapter._sendMail({ templateName: 'customEmail', direct: true })).toBeRejectedWith(Errors.Error.noRecipient);
    });

    it('catches exception during email sending', async () => {
      const adapter = new ApiMailAdapter(config);
      const error = new Error("Conversion error");
      spyOn(adapter, 'apiCallback').and.callFake(() => { throw error; });
      const options = {
        templateName: 'passwordResetEmail',
        link: 'http://example.com',
        appName: 'ExampleApp',
        user: user
      }
      await expectAsync(adapter._sendMail(options)).toBeRejectedWith(error);
    });

    it('catches exception during direct mail sending', async () => {
      const adapter = new ApiMailAdapter(config);
      const error = new Error("Conversion error");
      spyOn(adapter, 'apiCallback').and.callFake(() => { throw error; });
      const options = {
        templateName: 'customEmail',
        recipient: 'to@example.com',
        direct: true
      }
      await expectAsync(adapter._sendMail(options)).toBeRejectedWith(error);
    });

    it('loads template content files', async () => {
      const adapter = new ApiMailAdapter(config);
      const _loadFile = spyOn(adapter, '_loadFile').and.callThrough();
      const options = { message: {}, template: config.templates.customEmail };

      await adapter._createApiData(options);
      const subjectFileData = await fs.readFile(options.template.subjectPath);
      const textFileData = await fs.readFile(options.template.textPath);
      const htmlFileData = await fs.readFile(options.template.htmlPath);
      const subjectSpyData = await _loadFile.calls.all()[0].returnValue;
      const textSpyData = await _loadFile.calls.all()[1].returnValue;
      const htmlSpyData = await _loadFile.calls.all()[2].returnValue;

      expect(subjectSpyData.toString('utf8')).toEqual(subjectFileData.toString('utf8'));
      expect(textSpyData.toString('utf8')).toEqual(textFileData.toString('utf8'));
      expect(htmlSpyData.toString('utf8')).toEqual(htmlFileData.toString('utf8'));
    });

    it('fills placeholders with callback values', async () => {
      const adapter = new ApiMailAdapter(config);
      const _fillPlaceholders = spyOn(adapter, '_fillPlaceholders').and.callThrough();
      const options = {
        message: {},
        template: config.templates.customEmail,
        placeholders: { appName: 'ExampleApp' }
      };

      await adapter._createApiData(options);

      expect(_fillPlaceholders.calls.all()[0].args[0]).not.toContain('ExampleApp');
      expect(_fillPlaceholders.calls.all()[1].args[0]).not.toContain('ExampleApp');
      expect(_fillPlaceholders.calls.all()[2].args[0]).not.toContain('ExampleApp');
      expect(_fillPlaceholders.calls.all()[0].returnValue).toContain('ExampleApp');
      expect(_fillPlaceholders.calls.all()[1].returnValue).toContain('ExampleApp');
      expect(_fillPlaceholders.calls.all()[2].returnValue).toContain('ExampleApp');
    });
  });

  describe('invoke _loadFile', function () {

    it('rejects with error if file loading fails', async () => {
      const adapter = new ApiMailAdapter(config);
      const invalidPath = path.join(__dirname, 'templates/invalid.txt');

      await expectAsync(adapter._loadFile(invalidPath)).toBeRejected();
    });

    it('resolves if file loading succeeds', async () => {
      const adapter = new ApiMailAdapter(config);
      const validPath = path.join(__dirname, 'templates/custom_email.txt');

      const data = await adapter._loadFile(validPath);
      expect(data).toBeInstanceOf(Buffer);
    });
  });

  describe('placeholders', function () {

    it('returns valid placeholders', async () => {
      const adapter = new ApiMailAdapter(config);
      const placeholders = { key: 'value' };
      expect(adapter._validatePlaceholders(placeholders)).toEqual({ key: 'value' });
    });

    it('returns empty object for invalid placeholders', async () => {
      const adapter = new ApiMailAdapter(config);
      const placeholders = 'invalid';
      expect(adapter._validatePlaceholders(placeholders)).toEqual({});
    });

    it('fills in the template placeholder without placeholder callback', async () => {
      const adapter = new ApiMailAdapter(config);
      const apiCallback = spyOn(adapter, 'apiCallback').and.callThrough();
      const email = {
        templateName: 'customEmailWithPlaceholderCallback',
        recipient: 'to@example.com',
        direct: true
      }
      const template = config.templates[email.templateName];
      const templatePlaceholder = template.placeholders.appName;
      const callbackPlaceholder = (await config.templates[email.templateName].placeholderCallback()).appName;
      spyOn(template, 'placeholderCallback').and.callFake(() => {});

      await adapter._sendMail(email);
      expect(apiCallback.calls.all()[0].args[0].payload.text).toContain(templatePlaceholder);
      expect(apiCallback.calls.all()[0].args[0].payload.text).not.toContain(callbackPlaceholder);
    });

    it('overrides the template placeholder with the callback placeholder', async () => {
      const adapter = new ApiMailAdapter(config);
      const apiCallback = spyOn(adapter, 'apiCallback').and.callThrough();
      const email = {
        templateName: 'customEmailWithPlaceholderCallback',
        recipient: 'to@example.com',
        direct: true
      }
      const template = config.templates[email.templateName];
      const templatePlaceholder = template.placeholders.appName;
      const callbackPlaceholder = (await template.placeholderCallback()).appName;

      await adapter._sendMail(email);
      expect(apiCallback.calls.all()[0].args[0].payload.text).toContain(callbackPlaceholder);
      expect(apiCallback.calls.all()[0].args[0].payload.text).not.toContain(templatePlaceholder);
    });

    it('overrides the template placeholder with the email placeholder', async () => {
      const adapter = new ApiMailAdapter(config);
      const apiCallback = spyOn(adapter, 'apiCallback').and.callThrough();
      const email = {
        templateName: 'customEmailWithPlaceholderCallback',
        recipient: 'to@example.com',
        direct: true,
        placeholders: {
          appName: "EmailPlaceholder"
        }
      }
      const template = config.templates[email.templateName];
      const templatePlaceholder = template.placeholders.appName;
      const emailPlaceholder = email.placeholders.appName;
      spyOn(template, 'placeholderCallback').and.callFake(async () => {
        return {};
      });

      await adapter._sendMail(email);
      expect(apiCallback.calls.all()[0].args[0].payload.text).toContain(emailPlaceholder);
      expect(apiCallback.calls.all()[0].args[0].payload.text).not.toContain(templatePlaceholder);
    });

    it('makes placeholders accessible in placeholder callback', async () => {
      const adapter = new ApiMailAdapter(config);
      const templateName = 'customEmailWithPlaceholderCallback';
      const template = config.templates[templateName];
      const email = { templateName, link, appName, user };
      const placeholderCallback = spyOn(template, 'placeholderCallback').and.callThrough();

      await adapter._sendMail(email);
      expect(placeholderCallback.calls.all()[0].args[0].placeholders.link).toBe(link);
      expect(placeholderCallback.calls.all()[0].args[0].placeholders.appName).toBe(appName);
    });

    it('makes user locale accessible in placeholder callback', async () => {
      const adapter = new ApiMailAdapter(config);
      const apiCallback = spyOn(adapter, 'apiCallback').and.callThrough();
      const email = {
        templateName: 'customEmailWithPlaceholderCallbackAndLocaleCallback',
        recipient: 'to@example.com',
        direct: true
      }
      const template = config.templates[email.templateName];
      const locale = await template.localeCallback();

      await adapter._sendMail(email);
      expect(apiCallback.calls.all()[0].args[0].locale).toBe(locale);
    });
  });

  describe('localization', () => {
    let adapter;
    let options;
    let apiCallback;

    beforeEach(async () => {
      adapter = new ApiMailAdapter(config);
      apiCallback = spyOn(adapter, 'apiCallback').and.callFake(apiResponseSuccess);

      options = {
        message: {},
        template: config.templates.customEmailWithLocaleCallback,
        placeholders: {},
      };
    });

    it('uses user locale variable from user locale callback', async () => {
      const _loadFile = spyOn(adapter, '_loadFile').and.callThrough();
      await adapter._createApiData(options);

      const subjectFileData = await fs.readFile(path.join(__dirname, 'templates/de-AT/custom_email_subject.txt'));
      const textFileData = await fs.readFile(path.join(__dirname, 'templates/de-AT/custom_email.txt'));
      const htmlFileData = await fs.readFile(path.join(__dirname, 'templates/de-AT/custom_email.html'));
      const subjectSpyData = await _loadFile.calls.all()[0].returnValue;
      const textSpyData = await _loadFile.calls.all()[1].returnValue;
      const htmlSpyData = await _loadFile.calls.all()[2].returnValue;

      expect(subjectSpyData.toString('utf8')).toEqual(subjectFileData.toString('utf8'));
      expect(textSpyData.toString('utf8')).toEqual(textFileData.toString('utf8'));
      expect(htmlSpyData.toString('utf8')).toEqual(htmlFileData.toString('utf8'));
    });

    it('falls back to language localization if there is no locale match', async () => {
      // Pretend that there are not files in folder `de-AT`
      spyOn(adapter, '_fileExists').and.callFake(async (path) => {
        return !/\/templates\/de-AT\//.test(path);
      });
      const _loadFile = spyOn(adapter, '_loadFile').and.callThrough();
      await adapter._createApiData(options);

      const subjectFileData = await fs.readFile(path.join(__dirname, 'templates/de/custom_email_subject.txt'));
      const textFileData = await fs.readFile(path.join(__dirname, 'templates/de/custom_email.txt'));
      const htmlFileData = await fs.readFile(path.join(__dirname, 'templates/de/custom_email.html'));
      const subjectSpyData = await _loadFile.calls.all()[0].returnValue;
      const textSpyData = await _loadFile.calls.all()[1].returnValue;
      const htmlSpyData = await _loadFile.calls.all()[2].returnValue;

      expect(subjectSpyData.toString('utf8')).toEqual(subjectFileData.toString('utf8'));
      expect(textSpyData.toString('utf8')).toEqual(textFileData.toString('utf8'));
      expect(htmlSpyData.toString('utf8')).toEqual(htmlFileData.toString('utf8'));
    });

    it('falls back to default file if there is no language or locale match', async () => {
      // Pretend that there are no files in folders `de-AT` and `de`
      spyOn(adapter, '_fileExists').and.callFake(async (path) => {
        return !/\/templates\/de(-AT)?\//.test(path);
      });
      const _loadFile = spyOn(adapter, '_loadFile').and.callThrough();
      await adapter._createApiData(options);

      const subjectFileData = await fs.readFile(path.join(__dirname, 'templates/custom_email_subject.txt'));
      const textFileData = await fs.readFile(path.join(__dirname, 'templates/custom_email.txt'));
      const htmlFileData = await fs.readFile(path.join(__dirname, 'templates/custom_email.html'));
      const subjectSpyData = await _loadFile.calls.all()[0].returnValue;
      const textSpyData = await _loadFile.calls.all()[1].returnValue;
      const htmlSpyData = await _loadFile.calls.all()[2].returnValue;

      expect(subjectSpyData.toString('utf8')).toEqual(subjectFileData.toString('utf8'));
      expect(textSpyData.toString('utf8')).toEqual(textFileData.toString('utf8'));
      expect(htmlSpyData.toString('utf8')).toEqual(htmlFileData.toString('utf8'));
    });

    it('falls back to default file if file access throws', async () => {
      const getLocalizedFilePathSpy = spyOn(adapter, '_getLocalizedFilePath').and.callThrough();
      spyOn(fs, 'access').and.callFake(async () => {
        throw 'Test file access error';
      });
      await adapter._createApiData(options);
      const file = await getLocalizedFilePathSpy.calls.all()[0].returnValue;
      expect(file).toMatch(options.template.subjectPath);
    });

    it('makes user locale available in API callback', async () => {
      const locale = await options.template.localeCallback();
      const email = {
        templateName: 'customEmailWithLocaleCallback',
        recipient: 'to@example.com',
        direct: true
      }
      await adapter._sendMail(email);
      expect(apiCallback.calls.all()[0].args[0].locale).toContain(locale);
    });
  });
});
