"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WITHDRAWAL_STATUS = exports.Status = exports.Type = void 0;
var Type;
(function (Type) {
    Type["CREDIT"] = "CREDIT";
    Type["WITHDRAWAL"] = "WITHDRAWAL";
})(Type || (exports.Type = Type = {}));
var Status;
(function (Status) {
    Status["ACTIVE"] = "ACTIVE";
    Status["INACTIVE"] = "INACTIVE";
})(Status || (exports.Status = Status = {}));
var WITHDRAWAL_STATUS;
(function (WITHDRAWAL_STATUS) {
    WITHDRAWAL_STATUS["PENDING"] = "PENDING";
    WITHDRAWAL_STATUS["APPROVED"] = "APPROVED";
    WITHDRAWAL_STATUS["REJECTED"] = "REJECTED";
})(WITHDRAWAL_STATUS || (exports.WITHDRAWAL_STATUS = WITHDRAWAL_STATUS = {}));
//# sourceMappingURL=types.js.map