/**
    Account names may contain one or more names separated by a dot.
    Each name needs to start with a letter and may contain
    numbers, or well placed dashes.
    @see is_valid_name graphene/libraries/chain/protocol/account.cpp
*/
let id_regex = /\b\d+\.\d+\.(\d+)\b/;

var chainValidation = {
    is_account_name: function is_account_name(value) {
        var allow_too_short =
            arguments.length > 1 && arguments[1] !== undefined
                ? arguments[1]
                : false;

        var i, label, len, length, ref;

        if (this.is_empty(value)) {
            return false;
        }

        length = value.length;

        if ((!allow_too_short && length < 3) || length > 63) {
            return false;
        }

        ref = value.split(".");

        for (i = 0, len = ref.length; i < len; i++) {
            label = ref[i];

            if (
                !(
                    /^[a-z][a-z0-9-]*$/.test(label) &&
                    !/--/.test(label) &&
                    /[a-z0-9]$/.test(label)
                )
            ) {
                return false;
            }
        }
        return true;
    },
    is_password_error: function is_password_error(value) {
        var suffix = "password.";
        if (value == null || value.length === 0) {
            return suffix + "empty";
        }
        if (!new RegExp(/[0-9]/).test(value)) {
            return suffix + "rule1";
        }
        if (!new RegExp(/[a-z]/).test(value)) {
            return suffix + "rule2";
        }
        if (!new RegExp(/[A-Z]/).test(value)) {
            return suffix + "rule3";
        }
        if (value.length < 40) {
            return suffix + "less";
        }
        return null;
    },
    is_account_name_error: function is_account_name_error(
        value,
        allow_too_short
    ) {
        var shortlen =
            arguments.length > 2 && arguments[2] !== undefined
                ? arguments[2]
                : 3;
        var maxlen =
            arguments.length > 3 && arguments[3] !== undefined
                ? arguments[3]
                : 63;

        var i, label, len, length, ref, suffix;
        if (allow_too_short == null) {
            allow_too_short = false;
        }
        suffix = "suffix.";
        if (value == null || value.length === 0) {
            return suffix + "empty";
        }
        length = value.length;
        if (!allow_too_short && length < shortlen) {
            return suffix + "longer";
        }
        if (length > maxlen) {
            return suffix + "shorter";
        }
        var checkstr = value;
        checkstr.toLowerCase();
        if (checkstr.indexOf("zos") > -1) {
            return suffix + "contain";
        }
        var strTemp = value.substr(0, 1);
        if (
            !(
                (strTemp >= "a" && strTemp <= "z") ||
                (strTemp >= "A" && strTemp <= "Z")
            )
        ) {
            return suffix + "begin";
        }
        if (!new RegExp(/^[0-9a-zA-Z-]{1,}$/).test(value)) {
            return suffix + "rule";
        }
        if (/\./.test(value)) {
            suffix = "segment.";
        }
        ref = value.split(".");
        for (i = 0, len = ref.length; i < len; i++) {
            label = ref[i];
            if (!/^[~a-z]/.test(label)) {
                return suffix + "start";
            }
            if (!/^[~a-z0-9-]*$/.test(label)) {
                return suffix + "only";
            }
            if (/--/.test(label)) {
                return suffix + "oneDash";
            }
            if (!/[a-z0-9]$/.test(label)) {
                return suffix + "end";
            }
            if (!(label.length >= 1)) {
                return suffix + "longer";
            }
        }
        return null;
    },

    is_object_id: function(obj_id) {
        if ("string" != typeof obj_id) return false;

        let match = id_regex.exec(obj_id);
        return match !== null && obj_id.split(".").length === 3;
    },

    is_empty: function(value) {
        return value == null || value.length === 0;
    },

    is_cheap_name: function(account_name) {
        return /[0-9-]/.test(account_name) || !/[aeiouy]/.test(account_name);
    },

    is_empty_user_input: function(value) {
        if (this.is_empty(value)) {
            return true;
        }
        if ((value + "").trim() === "") {
            return true;
        }
        return false;
    },

    required: function(value, field_name = "") {
        if (this.is_empty(value)) {
            throw new Error("value required for " + field_name + ": " + value);
        }
        return value;
    },

    /** @see is_valid_symbol graphene/libraries/chain/protocol/asset_ops.cpp */
    is_valid_symbol_error: function(value) {
        var suffix = "Asset name should ";
        if (this.is_empty(value)) {
            return suffix + "not be empty.";
        }
        if (value.split(".").length > 2) {
            return suffix + "have only one dot.";
        }
        if (value.length < 3) {
            return suffix + "be longer.";
        }
        if (value.length > 16) {
            return suffix + "be shorter.";
        }
        if (!/^[A-Z]/.test(value)) {
            return suffix + "start with a letter";
        }
        if (!/[A-Z0-9]$/.test(value)) {
            return suffix + "end with a letter or number";
        }
        if (/^[A-Z0-9\.]$/.test(value)) {
            return suffix + "contain only letters numbers and perhaps a dot.";
        }
        return null;
    }
};

export default chainValidation;
