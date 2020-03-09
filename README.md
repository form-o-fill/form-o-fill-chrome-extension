# Form-O-Fill Chrome Extension


## Important notice about store removal!

The chrome store "team" has decided to removed Form-O-Fill from the store because it required too many and too broad permissions.  
On 7th of march the extension was removed even though I changed the permission as required.   
Since it is impossible to get helpful information from the store "team" I decided **to not publish** this extension in the store anymore.  
I'm sorry for those still using it but coping with the store system of allowing or disallowing extensions feels too tedious for now.

The extension still works as expected if you build and install it locally.

-----------

### The programmable form filler for developers.

This is a chrome extension for filling out forms in webpages.
This extension is targeted at web developers who frequently must fill out long \<form>s while working on a website.
The configuration is done via a rule definition file written in javascript.


# PERMISSIONS
The extension requires these permissions at the moment:

1. `Read and change all your data on the websites that you visit`  
  Form-O-Fill is built to work on every website thus requiring very broad permissions to access all form-fields on every site you visit.
  
2. `Display notifications`  
   Used for notify you of failed actions.
   
3. `Communicate with cooperating websites`  
   This permission is used to make the "[Live Tutorials](https://form-o-fill.github.io/tutorial/)" and the "remote rule import" (See help under "Using Remote Rules") possible. It allows the extension to "talk" to two sites that are used for these features.  
   Sites are defined [here](https://github.com/form-o-fill/form-o-fill-chrome-extension/blob/master/src/manifest.json#L35-L38).
 

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

- Fork the repo and create a branch named after the thing you are fixing / implementing (``git checkout -b implement-a-flux-capacitator``)
- We use eslint to check our code. Please install it with [npm install -g esilint](http://eslint.org).
- Implement and check your code with eslint (``eslint src``)
- Test your code using mocha, chai and sinon. Executing ``gulp`` will run all tests (there's also ``gulp watch``).
- Everything works and eslint is happy?
- Commit push and PULL REQUEST away.
- Thank you!

# TESTING
*Mocha*: See http://mochajs.org/  
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
