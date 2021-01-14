/**
 * ==============================================================
 * Demo script to send an email using the Mailgun API.
 * ==============================================================
 * Instructions:
 * 
 * 1. Create a file `mailgun.json` in the root directory with the
 * following keys to configure the test script:
 * ```
 * {
 *   key: "xxx", // The Mailgun API key.
 *   domain: "xxx", // The Mailgun domain.
 *   host: "xxx", // The Mailgun host.
 *   sender: "xxx", // The email sender.
 *   recipient: "xxx", // The email recipient.
 * }
 * ```
 * 
 * 2. Run this script with `node ./demo` to send the email.
 * ==============================================================
 */

const ApiMailAdapter = require('../src/ApiMailAdapter');
const ApiPayloadConverter = require('../src/ApiPayloadConverter');
const mailgun = require('mailgun.js');
const path = require('path');

const {
    key,
    domain,
    host,
    sender,
    recipient
} = require('./mailgun.json');

const mailgunClient = mailgun.client({ username: 'api', key: key });
const filePath = (file) => path.resolve(__dirname, '../spec/templates/', file);
const config = {
    sender: sender,
    templates: {
        passwordResetEmail: {
            subjectPath: filePath('password_reset_email_subject.txt'),
            textPath: filePath('password_reset_email.txt'),
            htmlPath: filePath('password_reset_email.html')
        },
        verificationEmail: {
            subjectPath: filePath('verification_email_subject.txt'),
            textPath: filePath('verification_email.txt'),
            htmlPath: filePath('verification_email.html')
        },
        customEmail: {
            subjectPath: filePath('custom_email_subject.txt'),
            textPath: filePath('custom_email.txt'),
            htmlPath: filePath('custom_email.html'),
            placeholders: {
                username: "DefaultUser",
                appName: "DefaultApp"
            },
            extra: {
                replyTo: 'no-reply@example.com'
            }
        }
    },
    apiCallback: async ({ payload }) => {
        const mailgunPayload = ApiPayloadConverter.mailgun(payload);
        await mailgunClient.messages.create(domain, mailgunPayload);
    }
};

const adapter = new ApiMailAdapter(config);

adapter.sendMail({
    templateName: 'customEmail',
    recipient: recipient,
    placeholders: {
        appName: "ExampleApp",
        username: "ExampleUser"
    },
    direct: true
});