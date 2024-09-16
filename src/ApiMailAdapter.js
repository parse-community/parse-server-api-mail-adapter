const path = require('path');
const fs = require('fs').promises;
const Mustache = require('mustache');
const MailAdapter = require('./MailAdapter');
const Errors = require('./Errors');

/**
 * @class ApiMailAdapter
 * @description An email adapter for Parse Server to send emails via mail provider APIs.
 */
class ApiMailAdapter extends MailAdapter {
  /**
   * Creates a new mail adapter.
   * @param {Object} options The configuration options.
   */
  constructor(options) {

    // Get parameters
    const { external = false, sender, templates = {}, apiCallback } = options || {};

    // Ensure required parameters are set
    if (!sender) {
      throw Errors.Error.configurationInvalid;
    }

    // Ensure email templates are set if this is not for external mail adapter.
    if (!external && !templates || Object.keys(templates).length === 0) {
      throw Errors.Error.templatesInvalid;
    }

    // Ensure API callback is set
    if (typeof apiCallback !== 'function') {
      throw Errors.Error.apiCallbackNoFunction;
    }

    // Initialize
    super(options);

    // Validate templates if not external
    if (!external){
      for (const key in templates) {
        this._validateTemplate(templates[key]);
      }
    }


    // Set properties
    this.external = external;
    this.sender = sender;
    this.templates = templates;
    this.apiCallback = apiCallback;
  }

  /**
   * @function sendPasswordResetEmail
   * @description Sends a password reset email.
   * @param {String} link The password reset link.
   * @param {String} appName The app name.
   * @param {String} user The Parse User.
   * @returns {Promise<Any>} The mail provider API response.
   */
  sendPasswordResetEmail({ link, appName, user }) {
    return this._sendMail({
      templateName: 'passwordResetEmail',
      link,
      appName,
      user
    });
  }

  /**
   * @function sendVerificationEmail
   * @description Sends a verification email.
   * @param {String} link The email verification link.
   * @param {String} appName The app name.
   * @param {String} user The Parse User.
   * @returns {Promise<Any>} The mail provider API response.
   */
  sendVerificationEmail({ link, appName, user }) {
    return this._sendMail({
      templateName: 'verificationEmail',
      link,
      appName,
      user
    });
  }

  /**
   * @function sendMail
   * @description Sends an email.
   * @param {String} [sender] The email from address.
   * @param {String} recipient The email recipient; if set overrides the email address of the `user`.
   * @param {String} [subject] The email subject.
   * @param {String} [text] The plain-text email content.
   * @param {String} [html] The HTML email content.
   * @param {String} [templateName] The template name or Id.
   * @param {Object} [placeholders] The template placeholders.
   * @param {Object} [extra] Any additional variables to pass to the mail provider API.
   * @param {Parse.User} [user] The Parse User that the is the recipient of the email.
   * @returns {Promise<Any>} The mail provider API response.
   */
  async sendMail({ sender, recipient, subject, text, html, templateName, placeholders, extra, user }) {
    return await this._sendMail({
      sender,
      recipient,
      subject,
      text,
      html,
      templateName,
      placeholders,
      extra,
      user,
      direct: true
    });
  }

  /**
   * @function _sendMail
   * @description Sends an email.
   * @param {Object} email The email to send.
   * @returns {Promise} The mail provider API response.
   */
  async _sendMail(email) {

    // Define parameters
    let message;
    const user = email.user;
    const userEmail = user ? user.get('email') : undefined;
    const templateName = email.templateName;

    // If template name is not set
    if (!this.external && !templateName && !email.direct) {
      throw Errors.Error.templateConfigurationNoName;
    }

    // Get template
    const template = this.templates[templateName];

    // If template does not exist
    if (!this.external && !template && !email.direct) {
      throw Errors.Error.noTemplateWithName(templateName);
    }

    // Add template placeholders;
    // Placeholders sources override each other in this order:
    // 1. Placeholders set in the template (default)
    // 2. Placeholders set in the email
    // 3. Placeholders returned by the placeholder callback
    let placeholders = {};

    // Add template placeholders
    if (template) {
      placeholders = Object.assign(placeholders, template.placeholders || {});
    }

    // If the email is sent directly via Cloud Code
    if (email.direct) {

      // If recipient is not set
      if (!email.recipient && !userEmail) {
        throw Errors.Error.noRecipient;
      }

      // Add placeholders specified in email
      Object.assign(placeholders, email.placeholders || {});

      // Set message properties
      message = Object.assign(
        {
          from: email.sender || this.sender,
          to: email.recipient || userEmail,
          subject: email.subject,
          text: email.text,
          html: email.html
        },
        email.extra || {}
      );

    } else {
      // Get email parameters
      const { link, appName } = email;

      // Add default placeholders for templates
      Object.assign(placeholders, {
        link,
        appName,
        email: userEmail,
        username: user.get('username')
      });

      // Set message properties
      message = {
        from: this.sender,
        to: userEmail
      };
    }

    // Create API data
    const { payload, locale } = (!this.external) ? await this._createApiData({ message, template, placeholders, user }) : {};

    // Send email
    return await this.apiCallback({ ...email, ...message, ...payload, locale, template, placeholders, user });
  }

  /**
   * @typedef {Object} CreateApiDataResponse
   * @property {Object} payload The generic API payload.
   * @property {String} payload.from The sender email address.
   * @property {String} payload.to The recipient email address.
   * @property {String} payload.replyTo The reply-to address.
   * @property {String} payload.subject The subject.
   * @property {String} payload.text The plain-text content.
   * @property {String} payload.html The HTML content.
   * @property {String} payload.message The MIME content.
   * @property {String} [locale] The user locale, if it has been determined via the
   * locale callback.
   */
  /**
   * @function _createApiData
   * @description Creates the API data, includes the payload and optional meta data.
   * @param {Object} options The payload options.
   * @param {Object} options.message The message to send.
   * @param {Object} options.template The email template to use.
   * @param {Object} [options.placeholders] The email template placeholders.
   * @param {Object} [options.user] The Parse User who is the email recipient.
   * @returns {Promise<CreateApiDataResponse>} The API data.
   */
  async _createApiData(options) {
    let { message } = options;
    const { template = {}, user, placeholders = {} } = options;
    const { placeholderCallback, localeCallback } = template;
    let locale;

    // If locale callback is set
    if (localeCallback) {

      // Get user locale
      locale = await localeCallback(user);
      locale = this._validateUserLocale(locale);
    }

    // If placeholder callback is set
    if (placeholderCallback) {

      // Copy placeholders to prevent any direct changes
      const placeholderCopy = Object.assign({}, placeholders);

      // Add placeholders from callback
      let callbackPlaceholders = await placeholderCallback({ user, locale, placeholders: placeholderCopy });
      callbackPlaceholders = this._validatePlaceholders(callbackPlaceholders);
      Object.assign(placeholders, callbackPlaceholders);
    }

    // Get subject content
    const subject = message.subject || await this._loadFile(template.subjectPath, locale);

    // If subject is available
    if (subject) {

      // Set email subject
      message.subject = subject.toString('utf8');

      // Fill placeholders in subject
      message.subject = this._fillPlaceholders(message.subject, placeholders);
    }

    // Get text content
    const text = message.text || await this._loadFile(template.textPath, locale);

    // If text content is available
    if (text) {

      // Set email text content
      message.text = text.toString('utf8');

      // Fill placeholders in text
      message.text = this._fillPlaceholders(message.text, placeholders);
    }

    // Get HTML content
    const html = message.html || (template.htmlPath ? await this._loadFile(template.htmlPath, locale) : undefined);

    // If HTML content is available
    if (html) {

      // Set email HTML content
      message.html = html.toString('utf8');

      // Fill placeholders in HTML
      message.html = this._fillPlaceholders(message.html, placeholders);
    }

    // Append any additional message properties;
    // Extras sources override each other in this order:
    // 1. Extras set in the template (default)
    // 2. Extras set when sending directly via sendMail()
    message = Object.assign({}, template.extra, message);

    // Assemble payload
    const payload = {
      from: message.from,
      to: message.to,
      subject: message.subject,
      text: message.text
    };

    // Add optional message properties
    if (message.html) {
      payload.html = message.html;
    }
    if (message.replyTo) {
      payload.replyTo = message.replyTo;
    }

    return { payload, locale };
  }

  /**
   * @function _loadFile
   * @description Loads a file's content.
   * @param {String} path The file path.
   * @param {String} locale The locale if a localized version of the file should be
   * loaded if available, or `undefined` if no localization should occur.
   * @returns {Promise<Buffer>} The file content.
   */
  async _loadFile(path, locale) {

    if (!path) return; // If path is not defined.

    // If localized file should be returned
    if (locale) {

      // Get localized file path
      const localizedFilePath = await this._getLocalizedFilePath(path, locale);
      path = localizedFilePath;
    }

    // Get file content
    const data = await fs.readFile(path);
    return data;
  }

  /**
   * @function _fillPlaceholders
   * @description Substitutes placeholders in a template with their values.
   * @param {String} template The template with placeholders, e.g. {{placeholder}}.
   * @param {Object} placeholders A map of placeholder keys with values.
   * @returns {String} The template with filled in placeholders.
   */
  _fillPlaceholders(template, placeholders) {
    return Mustache.render(template, placeholders)
  }

  /**
   * @function _validateTemplate
   * @description Validates a template.
   * @param {Object} template The template to validate.
   * @returns {}
   */
  _validateTemplate(template) {

    // Get template properties
    const { subjectPath, textPath, htmlPath, placeholderCallback, localeCallback } = template;

    // Validate paths
    if (typeof subjectPath !== 'string' || typeof textPath !== 'string' || (htmlPath && typeof htmlPath !== 'string')) {
      throw Errors.Error.templateContentPathInvalid;
    }

    // Validate placeholder callback
    if (placeholderCallback && typeof placeholderCallback !== 'function') {
      throw Errors.Error.templateCallbackNoFunction;
    }

    // Validate locale callback
    if (localeCallback && typeof localeCallback !== 'function') {
      throw Errors.Error.localeCallbackNoFunction;
    }
  }

  /**
   * @function _validatePlaceholders
   * @description Validates the template placeholders.
   * @param {Object} placeholders The template placeholders.
   * @returns {Object} The validated (cleaned) placeholders.
   */
  _validatePlaceholders(placeholders) {
    const validUserVars = placeholders && placeholders.constructor === Object;
    return validUserVars ? placeholders : {};
  }

  /**
   * @function _validateUserLocale
   * @description Validates the user locale callback result.
   * @param {String} locale The user locale.
   * @returns {String|undefined} Returns the locale or undefined if the locale is invalid.
   */
  _validateUserLocale(locale) {
    const isValid = typeof locale === 'string' && locale.length >= 2;
    return isValid ? locale : undefined;
  }

  /**
   * @function getLocalizedFilePath
   * @description Returns a localized file path matching a given locale.
   *
   * Localized files are placed in sub-folders of the given path, for example:
   *
   * root/
   * ├── base/                    // base path to files
   * │   ├── example.html         // default file
   * │   └── de/                  // de language folder
   * │   │   └── example.html     // de localized file
   * │   └── de-AT/               // de-AT locale folder
   * │   │   └── example.html     // de-AT localized file
   *
   * Files are matched with the user locale in the following order:
   * 1. Locale match, e.g. locale `de-AT` matches file in folder `de-AT`.
   * 2. Language match, e.g. locale `de-AT` matches file in folder `de`.
   * 3. Default match: file in base folder is returned.
   *
   * @param {String} filePath The file path.
   * @param {String} locale The locale to match.
   * @returns {Promise<String>} The localized file path, or the original file path
   * if a localized file could not be determined.
   */
  async _getLocalizedFilePath(filePath, locale) {
    // Get file name and base path
    const file = path.basename(filePath);
    const basePath = path.dirname(filePath);

    // If locale is not set return default file
    if (!locale) { return filePath; }

    // Check file for locale exists
    const localePath = path.join(basePath, locale, file);
    const localeFileExists = await this._fileExists(localePath);

    // If file for locale exists return file
    if (localeFileExists) { return localePath; }

    // Check file for language exists
    const languagePath = path.join(basePath, locale.split("-")[0], file);
    const languageFileExists = await this._fileExists(languagePath);

    // If file for language exists return file
    if (languageFileExists) { return languagePath; }

    // Return default file path
    return filePath;
  }

  /**
   * @function fileExists
   * @description Checks whether a file exists.
   * @param {String} path The file path.
   * @returns {Promise<Boolean>} Is true if the file can be accessed, false otherwise.
   */
  async _fileExists(path) {
    try {
      await fs.access(path);
      return true;
    } catch (e) {
      return false;
    }
  }
}

module.exports = ApiMailAdapter;
