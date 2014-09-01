// This should be everywhere on top:
//var chai = require("chai");
//var sinon = require("sinon");
//var expect = chai.expect;

// Mocha: See http://visionmedia.github.io/mocha/
//        Base testing framework providing describe/it/...
// Chai:  http://chaijs.com/
//        Provides Matchets and the expect() syntax familar to rspec users
// Sinon: http://sinonjs.org/
//        Mocking and Stubbing

// A dummy spec
describe('Testing with chai', function(){
  it('works', function(){
    expect(true).to.be.true;
  });

  it('fails if it should', function(){
    expect(true).to.be.false;
  });
});
