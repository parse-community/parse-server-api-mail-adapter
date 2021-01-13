# parse-server-api-mail-adapter

[![npm version](https://badge.fury.io/js/parse-server-api-mail-adapter.svg)](https://badge.fury.io/js/parse-server-api-mail-adapter)

The Parse Server API Mail Adapter enables Parse Server to send emails using any 3rd party API with built-in dynamic templates and localization.


# Content

- [Getting Started](#getting-started)
- [Demo](#demo)
- [Configuration](#configuration)
- [Templates](#templates)
- [Localization](#localization)
- [Need help?](#need-help)

# Getting Started

1. Install adapter:
    ```
    npm install --save parse-server-api-mail-adapter
    ```
2. Add [template files](#templates) to a subdirectory.
2. Add [adapter configuration](#configuration) to Parse Server.

# Demo

The demo script makes it easy to test adapter configurations and templates by sending emails without Parse Server via the email service provider [Mailgun](https://www.mailgun.com):

1. Create a file `mailgun.json` in the `demo` directory with the following content:
    ```js
    {
        "key": "MAILGUN_API_KEY", // e.g. abc123
        "domain": "MAILGUN_DOMAIN", // e.g. sandbox-example@mailgun.org
        "sender": "SENDER_EMAIL", // e.g. sender@example.com
        "recipient": "RECIPIENT_EMAIL" // e.g. recipient@example.com
    }
    ```
2. Run `node ./demo` to execute the script and send an email.

You can modify the script to use any other API you like or debug-step through the sending process to better understand the adapter internals.

# Configuration

An example configuation to add the API Mail Adapter to Parse Server could look like this:

```js
// Declare a mail client
const mailgun = require('mailgun.js');
const mailgunClient = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY });
const mailgunDomain = process.env.MAILGUN_DOMAIN;

// Configure Parse Server
const server = new ParseServer({
    ...otherOptions,

    emailAdapter: {
        module: 'parse-server-api-mail-adapter',
        options: {
            // The email address from which email are sent.
            sender: 'sender@example.com', 
            // The email templates.
            templates: {
                // The template used by Parse Server to send an email for password reset; this is a reserved template name.
                passwordResetEmail: {
                    subjectPath: './files/password_reset_email_subject.txt'),
                    textPath: './files/password_reset_email.txt'),
                    htmlPath: './files/password_reset_email.html')
                },
                // The template used by Parse Server to send an email for email address verification; this is a reserved template name.
                verificationEmail: {
                    subjectPath: './files/verification_email_subject.txt'),
                    textPath: './files/verification_email.txt'),
                    htmlPath: './files/verification_email.html')
                },
                // A custom email template that can be used when sending emails from Cloud Code; the template name can be choosen freely; it is possible to add various custom templates.
                customEmail: {
                    subjectPath: './files/custom_email_subject.txt'),
                    textPath: './files/custom_email.txt'),
                    htmlPath: './files/custom_email.html'),
                    // Placeholders contain the values to be filled into the placeholder keys in the file content. A placeholder `{{appName}}` in the email will be replaced the value defined here.
                    placeholders: {
                        appName: "ExampleApp"
                    },
                    // Extras to add to the email payload that is accessible in the `apiCallback`.
                    extra: {
                        replyTo: 'no-reply@example.com'
                    },
                    // A callback that makes the Parse User accessible and allows to return user-customized placeholders that will override the default template placeholders.
                    placeholderCallback: async (user) => {
                        return {
                            phone: user.get('phone')
                        };
                    },
                    // A callback that makes the Parse User accessible and allows to return the locale of the user for template localization.
                    localeCallback: async (user) => {
                        return user.get('locale');
                    }
                }
            },
            // The asynronous callback that contains the composed email payload to be passed on to an 3rd party API. The payload may need to be convert specifically for the API; conversion for common APIs is conveniently available in the `ApiPayloadConverter`. Below is an example for the Mailgun client.
            apiCallback: async (payload) => {
                const mailgunPayload = ApiPayloadConverter.mailgun(payload);
                await mailgunClient.messages.create(mailgunDomain, mailgunPayload);
            }
        }
    }
});
```

## Templates

Emails are composed using templates. A template defines the paths to its content files, for example:

```js
templates: {
    exampleTemplate: {
        subjectPath: './files/custom_email_subject.txt'),
        textPath: './files/custom_email.txt'),
        htmlPath: './files/custom_email.html'),
    }
},
```

There are different files for different parts of the email:
- subject (`subjectPath`)
- plain-text content (`textPath`)
- HTML content (`htmlPath`)

# Localization

Localization allows to use a specific template depending on the user locale. To turn on localization for a template, add a `localeCallback` to the template configuration.

The locale returned by `localeCallback` will be used to look for locale-specific template files. If the callback return an invalid locale or nothing at all (`undefined`), localization will be ignored and the default files will be used.

The locale-specific files are placed in subfolders with the name of either the whole locale (e.g. `de-AT`), or only the language (e.g. `de`). The locale has to be in format `[language]-[country]` as specified in [IETF BCP 47](https://tools.ietf.org/html/bcp47), e.g. `de-AT`.

Localized files are placed in subfolders of the given path, for example:
```
path/
├── example.html         // default file
└── de/                  // de language folder
│   └── example.html     // de localized file
└── de-AT/               // de-AT locale folder
│   └── example.html     // de-AT localized file
````

Files are matched with the user locale in the following order:
1. Locale match, e.g. locale `de-AT` matches file in folder `de-AT`.
2. Language match, e.g. locale `de-AT` matches file in folder `de`.
3. Default match: file in base folder is returned.

# Need help?

- Search through existing issues or open a new issue.
- Ask on StackOverflow using the tag `parse-server` and `api-mail-adapter`.
