global.chai = require("chai");
global.expect = require("chai").expect;
global.sinon = require("sinon");

var sinonChai = require("sinon-chai");
global.chai.use(sinonChai);
