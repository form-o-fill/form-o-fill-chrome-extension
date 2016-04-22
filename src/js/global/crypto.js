/*global sjcl */

// Small wrapper around sjcl
var Crypto = function(password) {
  this.password = password;
};

Crypto.prototype.encrypt = function(data) {
  return btoa(sjcl.encrypt(this.password, data));
};

// returns null if an error occured
// otherwise the cleartext
Crypto.prototype.decrypt = function(data) {
  try {
    return sjcl.decrypt(this.password, atob(data));
  } catch (e) {
    return null;
  }
};
