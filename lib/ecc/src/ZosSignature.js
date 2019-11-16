import PrivateKey from "./PrivateKey";
import Signature from "./signature";
import {sha256} from "./hash";

export default class ZosSignature {
    static signature(bufferHexStr, account, password, chain_id) {
        //var account = "dylan", role = "active", password = "qwer1234";
        let role = "active";
        let private_key = PrivateKey.fromSeed(account + role + password);
        chain_id =
            chain_id ||
            "6202d61065732dea57057bf4d9d60ed0a85d3a7712621516dce18d9da404fc79";
        //var bufferStr ="d092003642ce1f8a3d5c0100102700000000000000a5011fa08601000000000000000000 "
        //console.log("--bufferStr,buffer ----:",bufferHexStr);
        var tr_buffer = Buffer.from(bufferHexStr, "hex");
        let buff = Buffer.concat([new Buffer(chain_id, "hex"), tr_buffer]);
        //console.log("--signBuffer:",buff.toString("hex"))

        var sig = Signature.signBuffer(buff, private_key);

        let retBuff = sig.toBuffer().toString("hex");
        //console.log("retBuff",retBuff);
        return retBuff;
    }

    static signature2(bufferHexStr, account, password, role = "active") {
        //var account = "dylan", role = "active", password = "qwer1234";
        let private_key = PrivateKey.fromSeed(account + role + password);
        //console.log(sha256Str)
        var tr_buffer = Buffer.from(bufferHexStr, "hex");
        //console.log("--signBuffer:",tr_buffer.toString("hex"))
        var sig = Signature.signBuffer(tr_buffer, private_key);
        let retBuff = sig.toBuffer().toString("hex");
        //console.log("retBuff",retBuff);
        return retBuff;
    }

    static genPrikey(account, password, role = "active") {
        //var account = "dylan", role = "active", password = "qwer1234";
        let private_key = PrivateKey.fromSeed(account + role + password);
        return private_key.toWif();
    }
}
