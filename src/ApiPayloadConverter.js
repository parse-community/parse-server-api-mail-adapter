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

  /**
   * @description Converts the mail payload for the official AWS v3 SDK.
   * @param {Object} originalPayload The original payload (provider agnostic).
   * @returns {Object} The payload according to AWS SDK specification.
   */
   static awsSES(originalPayload) {

    // Clone payload
    const payload = Object.assign({}, originalPayload);

    if (payload.to) {
      payload.Destination = {
        ToAddresses: [payload.to]
      };
      delete payload.to;
    }

    if (payload.from) {
      payload.Source = [payload.from];
      delete payload.from;
    }

    if (payload.replyTo) {
      payload.ReplyToAddresses = [payload.replyTo];
      delete payload.replyTo;
    }

    if (payload.subject) {
      if (!payload.Message) {
        payload.Message = {}
      }

      if (!payload.Message.Subject) {
        payload.Message.Subject = {}
      }

      payload.Message.Subject.Data = payload.subject;
      payload.Message.Subject.Charset = 'UTF-8';
      delete payload.subject;
    }

    if (payload.html && payload.html !== '') {
      if (!payload?.Message) {
        payload.Message = {}
      }

      payload.Message.Body = {
        Html: {
          Charset: 'UTF-8',
          Data: payload.html
        }
      };
    } else {
      payload.Message.Body = {
        Html: {
          Charset: 'UTF-8',
          Data: payload.text
        }
      };
    }
    delete payload.html;
    delete payload.text;

    return payload;
  }
}

module.exports = ApiPayloadConverter;
