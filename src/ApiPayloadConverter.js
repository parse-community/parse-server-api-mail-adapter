/**
 * @class ApiPayloadConverter
 * @description Converter of mail payload for various mail provider APIs.
 */
class ApiPayloadConverter {

  /**
   * @description Converts the mail payload for the official Mailgun client.
   * @param {Object} data The original payload (provider agnostic).
   * @returns {Object} The payload according to Mailgun client specification.
   */
  static mailgun(data) {

    // Clone payload
    const payload = Object.assign({}, data);

    // Transform reply-to
    if (payload.replyTo) {
      payload['h:Reply-To'] = payload.replyTo;
      delete payload.replyTo;
    }

    return payload;
  }

  /**
   * @description Converts the mail payload for the AWS Simple Mail Service (AWS JavaScript SDK v3).
   * @param {Object} data The original payload (provider agnostic).
   * @returns {Object} The payload according to AWS SDK specification.
   */
  static awsSes(data) {

    // Clone payload
    const payload = Object.assign({}, data);

    // Transform sender
    payload.Source = [payload.from];
    delete payload.from;

    // Transform recipient
    payload.Destination = {
      ToAddresses: [payload.to]
    };
    delete payload.to;

    // Transform reply-to
    if (payload.replyTo) {
      payload.ReplyToAddresses = [payload.replyTo];
      delete payload.replyTo;
    }

    // If message has content
    if (payload.subject || payload.text || payload.html) {

      // Set default message
      payload.Message = {};

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
        payload.Message.Body = {};

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
    }

    return payload;
  }

  /**
   * Converts the mail payload for the ZeptoMail.
   * @param {Object} data The original payload
   * @param {String} data.api The provider API version.
   * @param {Object} data.payload The payload to convert to be compatible with the provider API.
   * @returns {Object} The payload according to ZeptoMail SDK specification.
   */
  static zeptomail(data) {

    // Clone payload
    const payload = Object.assign({}, data.payload);
    switch (data.api) {
      case '1.1': {

        // Transform sender
        payload.from = {
          address: payload.from
        }
        const emailString = payload.to;
        const emailAddresses = emailString.split(',').map(email => email.trim());
        const formattedEmails = emailAddresses.map((address) => ({
          email_address: {
            address: address.trim()
          }
        }));
        payload.to = formattedEmails;
        if (payload.replyTo) {
          payload.reply_to = [{
            address: payload.replyTo
          }
          ];
          delete payload.replyTo;
        }

        // If message has content
        if (payload.subject || payload.textbody || payload.htmlbody) {
          if (payload.text || payload.html) {
            payload.textbody = {};
            if (payload.text) {
              payload.textbody = payload.text;
              delete payload.text;
            }
            if (payload.html) {
              payload.htmlbody = payload.html;
              delete payload.html;
            }
          }
        }
        break;
      }
      default:
        throw new Error(`Unsupported ZeptoMail API version '${ data.api }'.`);
    }
    return payload;
  }
}

module.exports = ApiPayloadConverter;
