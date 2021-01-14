class Errors extends Error {

  /**
   * Creates a custom error.
   * @param {String} message The error message.
   */
  static customError(message) {
    return new Error(message);
  }

  /**
   * The preset errors.
   */
  static get Error() {
    return Object.freeze({
      configurationInvalid: new Error('ApiMailAdapter: configuration is missing or invalid.'),
      templatesInvalid: new Error('ApiMailAdapter: templates are missing or invalid.'),
      templateContentPathInvalid: new Error('ApiMailAdapter: template content path is invalid.'),
      apiCallbackNoFuncion: new Error('ApiMailAdapter: API callback is not a function.'),
      templateCallbackNoFunction: new Error('ApiMailAdapter: placeholder callback is not a function.'),
      localeCallbackNoFunction: new Error('ApiMailAdapter: locale callback is not a function.'),
      templateConfigurationNoName: new Error('ApiMailAdapter: template name is missing.'),
      noRecipient: new Error('ApiMailAdapter: recipient is missing.'),
      noTemplateWithName: (templateName) => new Error(`ApiMailAdapter: No template found with name '${templateName}'.`)
    });
  }
}

module.exports = Errors;
