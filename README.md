# Form-O-Fill Chrome Extension
 <img src="https://api.travis-ci.org/form-o-fill/form-o-fill-chrome-extension.svg?branch=master" style="float: right;" />

### The programmable form filler for developers.

This is a chrome extension for filling out forms in webpages.
This extension is targeted at web developers who frequently must fill out long \<form>s while working on a website.
The configuration is done via a rule definition file written in javascript.

Wann
Click to install:  
[<img src="https://raw.githubusercontent.com/form-o-fill/form-o-fill-chrome-extension/master/assets/available-in-chrome-store.png">](https://chrome.google.com/webstore/detail/form-o-fill-the-programma/iebbppibdpjldhohknhgjoapijellonp)

Or visit the site:
[http://form-o-fill.github.io](http://form-o-fill.github.io/)

# TODOS
[We use github issues for this](https://github.com/form-o-fill/form-o-fill-chrome-extension/issues?labels=enhancement&page=1&state=open)

# HOW TO REPORT ERRORS
Got an error you want to report? Perfect!  
Here are a few steps to make the error debugging easier on our side:

- Notice which version of Form-O-Fill you are using (Tools -> Extensions)
- Checkout (clone) this repository
- Checkout the version tag you noted earlier (eg. git checkout v1.0.0)
- If a rule does strange things, export or copy that rule from the rule editor using the export button.
- Deactivate the version of Form-O-Fill you got from the chrome web store.
- In Tools -> Extensions click on "Developer Mode" (top right) then click on "Load unpacked extension ..." and choose the "src" path of the git clone.
  See https://developer.chrome.com/extensions/getstarted#unpacked for details.
- Paste your saved rule in the rule editor.
- Bug still reproducable? Very good.
- File an issue (https://github.com/form-o-fill/form-o-fill-chrome-extension/issues)
- Attach the errornous rule and ideally a test HTML file activating that rule.
- If possible also export the logs you get with the cloned Form-O-Fill: Form-O-Fill Options -> Logs -> Download Logs
  Check that file for private / sensitive imformation and attach a gist to the issue you filed.
- The Form-O-Fill Team thanks you for taking the time.
- Perhaps ... a pull request to fix that bug :)

# CONTRIBUTING

You want to contribute to Form-O-Fill? That is awesome!  
Here are a few "rules" we like to adhere to:

- fork the repo and create a branch named after the thing you are fixing / implementing (``git checkout -b implement-a-flux-capacitator``)
- We use eslint to check our code. Please install it with [npm install -g esilint](http://eslint.org).
- Implement and check your code with eslint (``eslint src``)
- Test your code using mocha, chai and sinon. Executing ``gulp`` will run all tests (there's also ``gulp watch``).
- Everything works and eslint is happy?
- Commit push and PULL REQUEST away.
- Thank you!

# TESTING
*Mocha*: See http://visionmedia.github.io/mocha/  
Base testing framework providing describe/it/...

*Chai*: http://chaijs.com/  
Provides Matchets and the expect() syntax familar to rspec users

*Sinon*: http://sinonjs.org/  
Mocking and Stubbing

*jsdom*: https://github.com/tmpvar/jsdom  
DOM simulation when using jQuery.

All of this is initialized via ``test/support/spec_helper.js``. Take a look.

# LICENSE

## The MIT License (MIT)

Copyright (c) 2014 formofill team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

## License addition
The Software shall be used for Good, not Evil. 
