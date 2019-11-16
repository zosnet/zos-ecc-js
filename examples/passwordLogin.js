var ecc = require("../dist");
var PrivateKey = ecc.PrivateKey;

var account = "svk-firefox", role = "active", password = "dylan";

var private_key = PrivateKey.fromSeed(account + role + password);
console.log("svk-firefox pub key", private_key.toPublicKey().toString("TEST"));
