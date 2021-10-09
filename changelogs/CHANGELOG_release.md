# [2.1.0](https://github.com/mtrezza/parse-server-api-mail-adapter/compare/2.0.0...2.1.0) (2021-10-09)


### Bug Fixes

* bump dev dependencies ([#48](https://github.com/mtrezza/parse-server-api-mail-adapter/issues/48)) ([8e371b7](https://github.com/mtrezza/parse-server-api-mail-adapter/commit/8e371b7499605ac57cfe985b92032bddd270153d))
* bump semver-regex from 3.1.2 to 3.1.3 ([#47](https://github.com/mtrezza/parse-server-api-mail-adapter/issues/47)) ([8380a43](https://github.com/mtrezza/parse-server-api-mail-adapter/commit/8380a436cb3adc1c5519bdaa4e1dfd5f8259d879))
* upgrade dependencies ([a3ef631](https://github.com/mtrezza/parse-server-api-mail-adapter/commit/a3ef631894861e3bb1b29dc0b67c9c18b43b0410))

### Features

* add semantic release ([f1bc580](https://github.com/mtrezza/parse-server-api-mail-adapter/commit/f1bc580a471d087c7b936e42af5bed9ea45172f3))

# 2.0.0
[Full Changelog](https://github.com/mtrezza/parse-server-api-mail-adapter/compare/1.0.7...2.0.0)
### ⚠️ Breaking Changes
- Bumped Node.js version requirement to >=12 (Manuel Trezza) [#39](https://github.com/mtrezza/parse-server-api-mail-adapter/pull/39)
### 🧬 Other Changes
- Fixed demo script and README for `mailgun.js` 3.x which requires `form-data` (Stefan Trauth, Manuel Trezza) [#32](https://github.com/mtrezza/parse-server-api-mail-adapter/pull/32)

# 1.0.7
[Full Changelog](https://github.com/mtrezza/parse-server-api-mail-adapter/compare/1.0.6...1.0.7)

### 🧬 Other Changes
- Added supported providers to README (Manuel Trezza) [#34](https://github.com/mtrezza/parse-server-api-mail-adapter/pull/34)
- Bump postcss from 8.2.9 to 8.2.15 (dependabot) [#37](https://github.com/mtrezza/parse-server-api-mail-adapter/pull/37)

# 1.0.6
[Full Changelog](https://github.com/mtrezza/parse-server-api-mail-adapter/compare/1.0.5...1.0.6)

### 🧬 Other Changes
- Fixes failing to send email in Cloud Code without template (Manuel Trezza) [#26](https://github.com/mtrezza/parse-server-api-mail-adapter/pull/26)

# 1.0.5
[Full Changelog](https://github.com/mtrezza/parse-server-api-mail-adapter/compare/1.0.4...1.0.5)

### 🧬 Other Changes
- Fixes undefined `user` in `localeCallback` when sending email via `Parse.Cloud.sendEmail()` (wlky, Manuel Trezza) [#18](https://github.com/mtrezza/parse-server-api-mail-adapter/pull/18)

# 1.0.4
[Full Changelog](https://github.com/mtrezza/parse-server-api-mail-adapter/compare/1.0.3...1.0.4)

### 🐛 Fixes
- Fixed failing Parse Server adapter controller validation. [#13](https://github.com/mtrezza/parse-server-api-mail-adapter/pull/13). Thanks to [mtrezza](https://github.com/mtrezza).

### 🧬 Improvements
- Added lint to CI workflow. [#14](https://github.com/mtrezza/parse-server-api-mail-adapter/pull/14). Thanks to [mtrezza](https://github.com/mtrezza).

# 1.0.3
[Full Changelog](https://github.com/mtrezza/parse-server-api-mail-adapter/compare/1.0.2...1.0.3)

### 🐛 Fixes
- Added missing release script invocation when publishing package to npm. [#11](https://github.com/mtrezza/parse-server-api-mail-adapter/pull/11). Thanks to [mtrezza](https://github.com/mtrezza).

# 1.0.2
[Full Changelog](https://github.com/mtrezza/parse-server-api-mail-adapter/compare/1.0.1...1.0.2)

### 🧬 Improvements
- Added locale to placeholder callback. [#6](https://github.com/mtrezza/parse-server-api-mail-adapter/pull/6). Thanks to [mtrezza](https://github.com/mtrezza).
- Added current placeholders to placeholder callback. [#7](https://github.com/mtrezza/parse-server-api-mail-adapter/pull/7). Thanks to [mtrezza](https://github.com/mtrezza).

# 1.0.1
[Full Changelog](https://github.com/mtrezza/parse-server-api-mail-adapter/compare/1.0.0...1.0.1)

### 🐛 Fixes
- Removed unused config parameter from docs. [#1](https://github.com/mtrezza/parse-server-api-mail-adapter/pull/1). Thanks to [mtrezza](https://github.com/mtrezza).

### 🧬 Improvements
- ⚠️ Added locale to API callback. This is a breaking change because the `apiCallback` now returns an object `{payload, locale}` instead of only the `payload`. [#2](https://github.com/mtrezza/parse-server-api-mail-adapter/pull/2). Thanks to [mtrezza](https://github.com/mtrezza)
- Added badges to readme. [#3](https://github.com/mtrezza/parse-server-api-mail-adapter/pull/3). Thanks to [mtrezza](https://github.com/mtrezza)

# 1.0.0
- Initial commit.
