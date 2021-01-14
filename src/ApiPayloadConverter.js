/**
 * @class ApiPayloadConverter
 * @description Converter of mail payload for various mail provider APIs.
 */
class ApiPayloadConverter {

  /**
   * @description Converts the mail payload for the official Mailgun client.
   * @param {Object} originalPayload The original payload (provider agnostic).
   * @returns {Object} The payload according to Mailgun client specification.
   */
  static mailgun(originalPayload) {

    // Clone payload
    const payload = Object.assign({}, originalPayload);

    // Substitute keys
    if (payload.replyTo) {
      payload['h:Reply-To'] = payload.replyTo;
      delete payload.replyTo;
    }

    return payload;
  }
}

module.exports = ApiPayloadConverter;
