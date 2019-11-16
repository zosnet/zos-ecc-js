# ZOS-ECC-JS (zos-ecc-js)

Pure JavaScript Bitshares library for node.js and browsers. Can be used to construct, sign and broadcast transactions in JavaScript, and to easily obtain data from the blockchain via public apis.

Most of this code was written by [jcalfee](https://github.com/jcalfee), my work was mostly just repackaging to a discrete npm package.

[![npm version](https://img.shields.io/npm/v/bitsharesjs.svg?style=flat-square)](https://www.npmjs.com/package/bitsharesjs)
[![npm downloads](https://img.shields.io/npm/dm/bitsharesjs.svg?style=flat-square)](https://www.npmjs.com/package/bitsharesjs)


## Setup

This library can be obtained through npm:
```
npm install zos-ecc-js
```

## Usage
```
 html usage like this
 
<script type="text/javascript" src="../build/zos-ecc.min.js"></script>
<script type="text/javascript">
    var account = "dylan", password = "qwer1234";
    var chain_id = "6202d61065732dea57057bf4d9d60ed0a85d3a7712621516dce18d9da404fc79"
    var bufferStr ="d092003642ce1f8a3d5c0100102700000000000000a5011fa08601000000000000000000"
    var retBuff = zosEcc.ZosSignature.signature(bufferStr,account,password,chain_id);
    //console.log("retBuff",retBuff);
</script>
```

#### Login
The login class uses the following format for keys:

```
keySeed = accountName + role + password
```

Using this seed, private keys are generated for either the default roles `active, owner, memo`, or as specified. A minimum password length of 12 characters is enforced, but an even longer password is recommended. Three methods are provided:

```
generateKeys(account, password, [roles])
checkKeys(account, password, auths)
signTransaction(tr)
```

The auths object should contain the auth arrays from the account object. An example is this:

```
{
    active: [
        ["GPH5Abm5dCdy3hJ1C5ckXkqUH2Me7dXqi9Y7yjn9ACaiSJ9h8r8mL", 1]
    ]
}
```

If checkKeys is successful, you can use signTransaction to sign a TransactionBuilder transaction using the private keys for that account.


```

### ECC
The ECC library contains all the crypto functions for private and public keys as well as transaction creation/signing.

#### Private keys
As a quick example, here's how to generate a new private key from a seed (a brainkey for example):

```
var {PrivateKey, key} = require("zos-ecc-js");

let seed = "THIS IS A TERRIBLE BRAINKEY SEED WORD SEQUENCE";
let pkey = PrivateKey.fromSeed( key.normalize_brainKey(seed) );

console.log("\nPrivate key:", pkey.toWif());
console.log("Public key :", pkey.toPublicKey().toString(), "\n");
```

