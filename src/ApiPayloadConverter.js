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

    // Transform reply-to
    if (payload.replyTo) {
      payload['h:Reply-To'] = payload.replyTo;
      delete payload.replyTo;
    }

    return payload;
  }

  /**
   * @description Converts the mail payload for the AWS Simple Mail Service (AWS JavaScript SDK v3).
   * @param {Object} originalPayload The original payload (provider agnostic).
   * @returns {Object} The payload according to AWS SDK specification.
   */
  static awsSes(originalPayload) {

    // Clone payload
    const payload = Object.assign({}, originalPayload);

    // Transform recipient
    payload.Destination = {
      ToAddresses: [payload.to]
    };
    delete payload.to;

    // Transform sender
    payload.Source = [payload.from];
    delete payload.from;

    // Transform reply-to
    if (payload.replyTo) {
      payload.ReplyToAddresses = [payload.replyTo];
      delete payload.replyTo;
    }

    // Transform subject
    if (payload.subject) {
      payload.Message.Subject = {
        Data: payload.subject,
        Charset: 'UTF-8',
      };
      delete payload.subject;
    }

    // If message has body
    if (payload.text || payload.html) {

      // Set default body
      payload.Message = {
        Body: {}
      };

      // Transform plain-text
      if (payload.text) {
        payload.Message.Body.Text = {
          Charset: 'UTF-8',
          Data: payload.text,
        };
        delete payload.text;
      }

      // Transform HTML
      if (payload.html) {
        payload.Message.Body.Html = {
          Charset: 'UTF-8',
          Data: payload.html,
        };
        delete payload.html;
      }
    }

    return payload;
  }
}

module.exports = ApiPayloadConverter;
