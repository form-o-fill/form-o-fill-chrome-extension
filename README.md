# Form-O-Fill Chrome Extension

### A programmable form filler for developers.

This is a chrome extension for filling out forms in webpages.
This extension is targeted at web developers who frequently must fill out long \<form>s while working on a website.
The configuration is done via a rule definition file written in javascript.

# TODOS (in that order)

- cleanup createObjectURL() in logs.js after the user has clicked on it 
- write help for adding libraries dynamically via before function
- write help for general editor use (tabs, buttons)
- allow #help-basic to jump to #help and then #help-basic
- make context click extract that form instead of showing the overlay.
- syntax check for "before: function(resolve)". Must include "resolve"
- describe permissions requirements in "about"
- limit the number of tabs, add dropdown if too many.
- request permissions for http and https adhoc using https://developer.chrome.com/extensions/permissions
- Allow local file loading of JSON files and merge them last into rules. Use File API.
- Import Rule Definitions from other URLs via XHR (But how to validate them?)
- changelog menu entry in options
- Extract ALL strings/texts to messages
- add "de" locale at least
- autocomplete for moment.js and chance.js in ACE (see http://plnkr.co/edit/6MVntVmXYUbjR0DI82Cr?p=preview)
- show annotations in editor for all errors

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
