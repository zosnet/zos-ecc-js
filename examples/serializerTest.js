//import {PrivateKey,Signature,ZosSignature} from "../lib";
import { ops ,TransactionBuilder,PrivateKey,Aes} from "../lib";
import { TransactionHelper} from "../lib";
//const wifKey = "5KBuq5WmHvgePmB7w3onYsqLM8ESomM2Ae7SigYuuwg8MDHW7NN";
let account = "dylan";
let password = "qwer1234"
let pKey = PrivateKey.fromSeed(account + "active" + password);
//const pKey = PrivateKey.fromWif(wifKey);


let ref_block_num = 254833;
let ref_block_prefix= "0003e371007eb21c88851458efc777ff428252eb";
let expiration ="2019-01-20T18:02:45";

let nonce = TransactionHelper.unique_nonce_uint64();
let memoFromKey = "ZOS5zoQnCB2pdTyeVDbedaV6rLfox9JrDHpJ26jyff6FeWwWuLWFN";
console.log("memo pub key:", memoFromKey);
let memoToKey = "ZOS5zoQnCB2pdTyeVDbedaV6rLfox9JrDHpJ26jyff6FeWwWuLWFN";
let memo = "Testing transfer from node.js";
let memo_object = {
    from: memoFromKey,
    to: memoToKey,
    nonce,
    message: Aes.encrypt_with_checksum(
        pKey,
        memoToKey,
        nonce,
        memo
    )
}
//console.log("memo_object:",memo_object)

let tr = new TransactionBuilder(ref_block_num,ref_block_prefix,expiration)
//let transferObj = {fee:{amount:10000,asset_id:"1.3.0"},from:"1.2.165",to:"1.2.163",amount:{amount:99,asset_id:"1.3.0"},memo: memo_object}
//tr.add_type_operation( "transfer", transferObj )

tr.add_type_operation( "transfer", {
    fee: {
        amount: 1000,
        asset_id: "1.3.0"
    },
    from: "1.2.165",
    to: "1.2.163",
    amount: { amount: 999, asset_id: "1.3.0" },
    memo: memo_object
} )

tr.add_signer(pKey);
let  chain_id = "6202d61065732dea57057bf4d9d60ed0a85d3a7712621516dce18d9da404fc79"
tr.sign(chain_id)
console.log("tr:",JSON.stringify(tr.serialize()))

