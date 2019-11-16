import assert from "assert";
import {Signature, PublicKey, hash} from "../../ecc";
import {ops} from "../../serializer";
import ChainConfig from "./ChainConfig";
import ChainTypes from "./ChainTypes";
const Buffer = require("safe-buffer").Buffer;

var head_block_time_string, committee_min_review;

class TransactionBuilder {
    constructor(ref_block_num, ref_block_prefix, expiration) {
        this.ref_block_num = ref_block_num;
        this.ref_block_prefix = ref_block_prefix;
        this.expiration = expiration;
        this.operations = [];
        this.signatures = [];
        this.signer_private_keys = [];
    }

    /**
        @arg {string} name - like "transfer"
        @arg {object} operation - JSON matchching the operation's format
    */
    add_type_operation(name, operation) {
        this.add_operation(this.get_type_operation(name, operation));
        return;
    }


    /** Typically this is called automatically just prior to signing.  Once finalized this transaction can not be changed. */
    finalize() {
        if (this.tr_buffer) {
            throw new Error("already finalized");
        }
        this.ref_block_num = this.ref_block_num & 0xffff;
        this.ref_block_prefix = new Buffer(this.ref_block_prefix, "hex").readUInt32LE(4);
        //DEBUG console.log("ref_block",@ref_block_num,@ref_block_prefix,r)

        var iterable = this.operations;
        for (var i = 0, op; i < iterable.length; i++) {
            op = iterable[i];
            if (op[1]["finalize"]) {
                op[1].finalize();
            }
        }
        this.tr_buffer = ops.transaction.toBuffer(this);
    }

    /** @return {string} hex transaction ID */
    id() {
        if (!this.tr_buffer) {
            throw new Error("not finalized");
        }
        return hash
            .sha256(this.tr_buffer)
            .toString("hex")
            .substring(0, 40);
    }

    /**
        Typically one will use {@link this.add_type_operation} instead.
        @arg {array} operation - [operation_id, operation]
    */
    add_operation(operation) {
        if (this.tr_buffer) {
            throw new Error("already finalized");
        }
        assert(operation, "operation");
        if (!Array.isArray(operation)) {
            throw new Error("Expecting array [operation_id, operation]");
        }
        this.operations.push(operation);
        return;
    }

    get_type_operation(name, operation) {
        if (this.tr_buffer) {
            throw new Error("already finalized");
        }
        assert(name, "name");
        assert(operation, "operation");
        var _type = ops[name];
        assert(_type, `Unknown operation ${name}`);
        var operation_id = ChainTypes.operations[_type.operation_name];
        if (operation_id === undefined) {
            throw new Error(`unknown operation: ${_type.operation_name}`);
        }
        if (!operation.fee) {
            operation.fee = {amount: 0, asset_id: 0};
        }
        if (name === "proposal_create") {
            /*
            * Proposals involving the committee account require a review
            * period to be set, look for them here
            */
            let requiresReview = false,
                extraReview = 0;
            operation.proposed_ops.forEach(op => {
                const COMMITTE_ACCOUNT = 0;
                let key;

                switch (op.op[0]) {
                    case 0: // transfer
                        key = "from";
                        break;

                    case 6: //account_update
                    case 17: // asset_settle
                        key = "account";
                        break;

                    case 10: // asset_create
                    case 11: // asset_update
                    case 12: // asset_update_bitasset
                    case 13: // asset_update_feed_producers
                    case 14: // asset_issue
                    case 18: // asset_global_settle
                    case 43: // asset_claim_fees
                        key = "issuer";
                        break;

                    case 15: // asset_reserve
                        key = "payer";
                        break;

                    case 16: // asset_fund_fee_pool
                        key = "from_account";
                        break;

                    case 22: // proposal_create
                    case 23: // proposal_update
                    case 24: // proposal_delete
                        key = "fee_paying_account";
                        break;

                    case 31: // committee_member_update_global_parameters
                        requiresReview = true;
                        extraReview = 60 * 60 * 24 * 13; // Make the review period 2 weeks total
                        break;
                }
                if (key in op.op[1] && op.op[1][key] === COMMITTE_ACCOUNT) {
                    requiresReview = true;
                }
            });
            operation.expiration_time ||
                (operation.expiration_time =
                    base_expiration_sec() +
                    ChainConfig.expire_in_secs_proposal);
            if (requiresReview) {
                operation.review_period_seconds =
                    extraReview +
                    Math.max(
                        committee_min_review,
                        24 * 60 * 60 || ChainConfig.review_in_secs_committee
                    );
                /*
                * Expiration time must be at least equal to
                * now + review_period_seconds, so we add one hour to make sure
                */
                operation.expiration_time += 60 * 60 + extraReview;
            }
        }
        var operation_instance = _type.fromObject(operation);
        return [operation_id, operation_instance];
    }



    /** optional: there is a deafult expiration */
    set_expire_seconds(sec) {
        if (this.tr_buffer) {
            throw new Error("already finalized");
        }
        return (this.expiration = base_expiration_sec() + sec);
    }

    /* Wraps this transaction in a proposal_create transaction */
    propose(proposal_create_options) {
        if (this.tr_buffer) {
            throw new Error("already finalized");
        }
        if (!this.operations.length) {
            throw new Error("add operation first");
        }

        assert(proposal_create_options, "proposal_create_options");
        assert(
            proposal_create_options.fee_paying_account,
            "proposal_create_options.fee_paying_account"
        );

        let proposed_ops = this.operations.map(op => {
            return {op: op};
        });

        this.operations = [];
        this.signatures = [];
        this.signer_private_keys = [];
        proposal_create_options.proposed_ops = proposed_ops;
        this.add_type_operation("proposal_create", proposal_create_options);
        return this;
    }

    has_proposed_operation() {
        let hasProposed = false;
        for (var i = 0; i < this.operations.length; i++) {
            if ("proposed_ops" in this.operations[i][1]) {
                hasProposed = true;
                break;
            }
        }

        return hasProposed;
    }


    add_signer(private_key, public_key = private_key.toPublicKey()) {
        assert(private_key.d, "required PrivateKey object");

        if (this.signed) {
            throw new Error("already signed");
        }
        if (!public_key.Q) {
            public_key = PublicKey.fromPublicKeyString(public_key);
        }
        // prevent duplicates
        let spHex = private_key.toHex();
        for (let sp of this.signer_private_keys) {
            if (sp[0].toHex() === spHex) return;
        }
        this.signer_private_keys.push([private_key, public_key]);
    }

    sign(chain_id ) {
        if (!this.tr_buffer) {
            this.finalize();
            //throw new Error("not finalized");
        }
        if (this.signed) {
            throw new Error("already signed");
        }
        if (!this.signer_private_keys.length) {
            throw new Error(
                "Transaction was not signed. Do you have a private key? [no_signers]"
            );
        }
        var end = this.signer_private_keys.length;
        for (var i = 0; 0 < end ? i < end : i > end; 0 < end ? i++ : i++) {
            var [private_key, public_key] = this.signer_private_keys[i];
            var sig = Signature.signBuffer(
                Buffer.concat([new Buffer(chain_id, "hex"), this.tr_buffer]),
                private_key,
                public_key
            );
            this.signatures.push(sig.toBuffer());
        }
        this.signer_private_keys = [];
        this.signed = true;
        return;
    }

    serialize() {
        return ops.signed_transaction.toObject(this);
    }

    toObject() {
        return ops.signed_transaction.toObject(this);
    }

}

var base_expiration_sec = () => {
    var head_block_sec = Math.ceil(getHeadBlockDate().getTime() / 1000);
    var now_sec = Math.ceil(Date.now() / 1000);
    // The head block time should be updated every 3 seconds.  If it isn't
    // then help the transaction to expire (use head_block_sec)
    if (now_sec - head_block_sec > 30) {
        return head_block_sec;
    }
    // If the user's clock is very far behind, use the head block time.
    return Math.max(now_sec, head_block_sec);
};


function getHeadBlockDate() {
    return timeStringToDate(head_block_time_string);
}

function timeStringToDate(time_string) {
    if (!time_string) return new Date("1970-01-01T00:00:00.000Z");
    if (!/Z$/.test(time_string))
        //does not end in Z
        // https://github.com/cryptonomex/graphene/issues/368
        time_string = time_string + "Z";
    return new Date(time_string);
}

export default TransactionBuilder;
