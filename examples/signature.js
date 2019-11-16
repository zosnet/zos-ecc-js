import {PrivateKey,Signature,ZosSignature} from "../lib";

//let seed = "THIS IS A TERRIBLE BRAINKEY SEED WORD SEQUENCE";
//let pkey = PrivateKey.fromSeed( key.normalize_brainKey(seed) );


var account = "dylan", role = "active", password = "qwer1234";
var private_key = PrivateKey.fromSeed(account + role + password);
var public_key = private_key.toPublicKey()
//console.log("pkey",private_key)

//console.log("pubkey",pkey.toPublicKey())


var private_keyStr = private_key.toWif()
var public_keyStr = private_key.toPublicKey().toString()
console.log("\nPrivate key:", private_key.toWif());
console.log("Public key :", private_key.toPublicKey().toString(), "\n");

var chain_id = "6202d61065732dea57057bf4d9d60ed0a85d3a7712621516dce18d9da404fc79"
var bufferStr ="d092003642ce1f8a3d5c0100102700000000000000a5011fa08601000000000000000000 "
var tr_buffer = Buffer.from(bufferStr,'hex')
console.log("--bufferStr,buffer ----:",bufferStr)
let buff = Buffer.concat([new Buffer(chain_id, 'hex'), tr_buffer])
console.log("buff",buff.toString('hex'))

var sig = Signature.signBuffer(buff, private_key);
console.log(sig.toBuffer().toString('hex'));
//1f215b3aa8c3d68ee1566a576069c7aa9f074ccfc68e712c3077d01854c62eee85445d8ac0bf53e4266a4e5d0d08bee62b60d91544e1a21349785882a4491eee12


let retBuff = ZosSignature.signsature(bufferStr,account,password,chain_id);
console.log("retBuff",retBuff);