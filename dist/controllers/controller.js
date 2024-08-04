"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkController = void 0;
const uuid_1 = require("uuid");
const bcrypt = require("bcrypt");
const db_1 = require("../database/db");
const jwt = require("jsonwebtoken");
const types_1 = require("../models/types");
const helper_1 = require("../utilities/helper");
class NetworkController {
    constructor() {
        this.registerController = async (ctx) => {
            try {
                const { username, email, password } = ctx.request.body;
                const id = (0, uuid_1.v4)();
                const tenDigitCode = (0, helper_1.generateUniqueId)();
                const hash = await bcrypt.hash(password, 10);
                const newUser = await (0, db_1.default)("users")
                    .insert({
                    id,
                    name: username.toLowerCase(),
                    emailId: email.toLowerCase(),
                    password: hash,
                    status: types_1.Status.ACTIVE,
                    shortcode: tenDigitCode,
                })
                    .returning("*");
                const wallet = await (0, db_1.default)("wallet_history")
                    .insert({ id: (0, uuid_1.v4)(), user_id: id, amount: 0.0, type: types_1.Type.CREDIT })
                    .returning("*");
                // Generate JWT token
                newUser[0].password = "";
                const token = jwt.sign({ userPayload: newUser[0] }, "SAI_RAM", {
                    expiresIn: "24h", // Set the token expiration time
                });
                ctx.body = { user: newUser[0], token, wallet: wallet[0] };
            }
            catch (err) {
                ctx.body = "Internal Server Error";
                ctx.status = 500;
            }
        };
        this.loginController = async (ctx) => {
            try {
                const { email, password } = ctx.request.body;
                const user = await (0, db_1.default)("users")
                    .where({ emailId: email.toLowerCase() })
                    .returning("*");
                if (user.length == 0) {
                    ctx.body = "Invalid email or password";
                    ctx.status = 401;
                    return;
                }
                if (!(await bcrypt.compare(password, user[0].password))) {
                    ctx.body = "Invalid email or password";
                    ctx.status = 401;
                    return;
                }
                user[0].password = "";
                // Generate JWT token
                const token = jwt.sign({ userPayload: user[0] }, "SAI_RAM", {
                    expiresIn: "24h", // Set the token expiration time
                });
                ctx.body = { user, token };
            }
            catch (err) {
                console.error(err);
                ctx.body = "Internal Server Error";
                ctx.status = 500;
            }
        };
        this.getWalletDetails = async (ctx) => {
            try {
                const userDetails = ctx.state.userPayload;
                // Fetch the wallet details for the authenticated user
                const wallet = await (0, db_1.default)("wallet_history")
                    .where({ user_id: userDetails.id })
                    .returning("*");
                if (!wallet) {
                    ctx.body = "Wallet not found";
                    ctx.status = 404;
                    return;
                }
                const walletValue = wallet[0];
                const finalPrice = wallet.reduce((accumulator, curvalue) => {
                    if (curvalue.type === "CREDIT") {
                        console.log(parseInt(curvalue.amount) + accumulator, "INSIDE");
                        return parseInt(curvalue.amount) + accumulator;
                    }
                    else {
                        return accumulator - parseInt(curvalue.amount);
                    }
                }, 0);
                walletValue.amount = finalPrice;
                ctx.body = { wallet: walletValue };
            }
            catch (err) {
                console.error(err);
                ctx.body = "Internal Server Error";
                ctx.status = 500;
            }
        };
        this.getWalletHistoryDetails = async (ctx) => {
            try {
                const userDetails = ctx.state.userPayload;
                // Fetch the wallet details for the authenticated user
                const wallet = await (0, db_1.default)("wallet_history")
                    .where({ user_id: userDetails.id })
                    .returning("*");
                if (!wallet) {
                    ctx.body = "Wallet not found";
                    ctx.status = 404;
                    return;
                }
                ctx.body = { data: wallet };
            }
            catch (err) {
                console.error(err);
                ctx.body = "Internal Server Error";
                ctx.status = 500;
            }
        };
        this.joinController = async (ctx) => {
            var _a;
            try {
                const referralPayload = ctx.state.userPayload;
                const { shortcode, level } = ctx.request.body;
                if (referralPayload.emailId === "anudeep4n@gmail.com") {
                    const id = (0, uuid_1.v4)();
                    const userDetails = await (0, db_1.default)("users")
                        .where({ shortcode: shortcode })
                        .returning("*");
                    if (userDetails.length == 0) {
                        (ctx.body = "NO_USER_EXIST_WITH_THAT_STATUS_CODE"),
                            (ctx.status = 400);
                        return;
                    }
                    const hubDetails = await (0, db_1.default)("hub")
                        .where({ level: level })
                        .returning("*");
                    if (hubDetails.length == 0) {
                        (ctx.body = "NOT_CORRECT_LEVEL"), (ctx.status = 400);
                        return;
                    }
                    const membershipDetails = await (0, db_1.default)("network")
                        .insert({
                        id,
                        user_id: userDetails[0].id,
                        referrer_id: referralPayload.id,
                        hub_id: hubDetails[0].id,
                        type: types_1.Type.CREDIT,
                    })
                        .returning("*");
                    const walletUniqueId = (0, uuid_1.v4)();
                    const wallet = await (0, db_1.default)("wallet_history")
                        .insert({
                        id: walletUniqueId,
                        user_id: referralPayload.id,
                        amount: parseInt(hubDetails[0].price),
                        type: types_1.Type.CREDIT,
                    })
                        .returning("*");
                    ctx.body = { membershipDetails: "Successfully referred" };
                    ctx.status = 201;
                }
                else {
                    const fetchUserNetworkDetails = await (0, db_1.default)("network")
                        .where({ user_id: referralPayload.id })
                        .returning("*");
                    if (fetchUserNetworkDetails.length == 0) {
                        (ctx.body = "YOU_DO_NOT_HAVE_ANY_SUBSCRIPTION"), (ctx.status = 400);
                        return;
                    }
                    const referralDetails = await (0, db_1.default)("network")
                        .select("network.id", "network.type", "network.timestamp", "hub.name as hub_name", "hub.level", "hub.price")
                        .leftJoin("hub", "network.hub_id", "hub.id")
                        .where("network.user_id", referralPayload.id);
                    if (referralDetails.length === 0) {
                        (ctx.body = "SOMETHING_WENT_WRONG_PLEASE_RE_LOGIN_BY_REMOVING_CACHE"),
                            (ctx.status = 400);
                        return;
                    }
                    if (level < referralDetails[0].level) {
                        (ctx.body = "PLEASE_UPDATE_YOUR_SUBSCRIPTION"), (ctx.status = 400);
                        return;
                    }
                    const id = (0, uuid_1.v4)();
                    const userDetails = await (0, db_1.default)("users")
                        .where({ shortcode: shortcode })
                        .returning("*");
                    if (userDetails.length == 0) {
                        (ctx.body = "NO_USER_EXIST_WITH_THAT_STATUS_CODE"),
                            (ctx.status = 400);
                        return;
                    }
                    const hubDetails = await (0, db_1.default)("hub")
                        .where({ level: level })
                        .returning("*");
                    if (hubDetails.length == 0) {
                        (ctx.body = "NOT_CORRECT_LEVEL"), (ctx.status = 400);
                        return;
                    }
                    const membershipDetails = await (0, db_1.default)("network").insert({
                        id,
                        user_id: userDetails[0].id,
                        referrer_id: referralPayload.id,
                        hub_id: hubDetails[0].id,
                        type: types_1.Type.CREDIT,
                    });
                    await this.updateWalletDetails(userDetails, (_a = hubDetails[0]) === null || _a === void 0 ? void 0 : _a.price);
                    ctx.body = { membershipDetails: membershipDetails[0] };
                    ctx.status = 201;
                }
            }
            catch (err) {
                ctx.body = "Internal Server Error";
                ctx.status = 500;
            }
        };
        this.addHUBController = async (ctx) => {
            try {
                const id = (0, uuid_1.v4)();
                const { level, name, price } = ctx.request.body;
                const newLevel = await (0, db_1.default)("hub")
                    .insert({
                    id,
                    name,
                    level,
                    price,
                })
                    .returning("*");
                ctx.body = { level: newLevel[0] };
            }
            catch (err) {
                ctx.body = "Internal Server Error";
                ctx.status = 500;
            }
        };
        this.getLevelsController = async (ctx) => {
            try {
                const levels = await (0, db_1.default)("hub").select("*");
                ctx.body = { levels };
            }
            catch (err) {
                ctx.body = "Internal Server Error";
                ctx.status = 500;
            }
        };
        this.withdrawalController = async (ctx) => {
            try {
                const walletValue = await this.walletMoney(ctx);
                const { withdrawal_amount } = ctx.request.body;
                if (walletValue < withdrawal_amount) {
                    (ctx.body = "your asking more than in wallet we can not process this"),
                        (ctx.status = 400);
                    return;
                }
                const id = (0, uuid_1.v4)();
                const userPayload = ctx.state.userPayload;
                const withdrawalResponse = await (0, db_1.default)("withdrawals")
                    .insert({
                    id,
                    user_id: userPayload.id,
                    amount: withdrawal_amount,
                    status: types_1.WITHDRAWAL_STATUS.PENDING,
                })
                    .returning("*");
                ctx.status = 201;
                ctx.body = { data: withdrawalResponse[0] };
            }
            catch (err) {
                ctx.body = "Internal Server Error";
                ctx.status = 500;
            }
        };
        this.updateWithDrawalRequest = async (ctx) => {
            var _a, _b;
            try {
                const { status, withdrawalId } = ctx.request.body;
                const withdrawalResponse = await (0, db_1.default)("withdrawals")
                    .where({ id: withdrawalId })
                    .returning("*");
                ctx.state.userPayload.id = (_a = withdrawalResponse[0]) === null || _a === void 0 ? void 0 : _a.user_id;
                const walletValue = await this.walletMoney(ctx);
                if (walletValue < ((_b = withdrawalResponse[0]) === null || _b === void 0 ? void 0 : _b.amount)) {
                    (ctx.body = "your asking more than in wallet we can not process this"),
                        (ctx.status = 400);
                    return;
                }
                const updateWithdrawalResponse = await (0, db_1.default)("withdrawals")
                    .update({ status: status })
                    .where({ id: withdrawalId })
                    .returning("*");
                if (status === types_1.WITHDRAWAL_STATUS.APPROVED) {
                    await (0, db_1.default)("wallet_history").insert({
                        id: (0, uuid_1.v4)(),
                        user_id: ctx.state.userPayload.id,
                        amount: withdrawalResponse[0].amount,
                        type: types_1.Type.WITHDRAWAL,
                    });
                }
                ctx.status = 200;
                ctx.body = {
                    data: updateWithdrawalResponse,
                };
            }
            catch (err) {
                ctx.status = 500;
                ctx.body = "Internal Server Error";
            }
        };
        this.withdrawalList = async (ctx) => {
            try {
                const status = ctx.params.status;
                const withDrawalResponse = await (0, db_1.default)("withdrawals")
                    .select("*")
                    .where({ status });
                ctx.body = { data: withDrawalResponse };
                ctx.status = 200;
            }
            catch (err) {
                ctx.status = 500;
                ctx.body = "Internal Server Error";
            }
        };
        this.walletMoney = async (ctx) => {
            const userDetails = ctx.state.userPayload;
            // Fetch the wallet details for the authenticated user
            const wallet = await (0, db_1.default)("wallet_history")
                .where({ user_id: userDetails.id })
                .returning("*");
            if (!wallet) {
                ctx.body = "Wallet not found";
                ctx.status = 404;
                return;
            }
            const finalPrice = wallet.reduce((accumulator, curvalue) => {
                if (curvalue.type === "CREDIT") {
                    return parseInt(curvalue.amount) + accumulator;
                }
                else {
                    accumulator - parseInt(curvalue.amount);
                }
            }, 0);
            return finalPrice;
        };
        this.updateWalletDetails = async (userDetails, price) => {
            var _a, _b, _c;
            const distribution = [
                { level: 1, percentage: 25 },
                { level: 2, percentage: 10 },
                { level: 3, percentage: 5 },
                { level: 4, percentage: 2.5 },
            ];
            let finallyCompanywallet = price;
            let userDetailId = userDetails[0].id;
            for (let i = 0; i < 4; i++) {
                const walletUserId = await (0, db_1.default)("network")
                    .select("*")
                    .where({ user_id: userDetailId });
                if (walletUserId.length === 0) {
                    break;
                }
                const amountToTransfer = (price * distribution[i].percentage) / 100;
                finallyCompanywallet = finallyCompanywallet - amountToTransfer;
                userDetailId = (_a = walletUserId[0]) === null || _a === void 0 ? void 0 : _a.referrer_id;
                const wallet = await (0, db_1.default)("wallet_history").insert({
                    id: (0, uuid_1.v4)(),
                    user_id: (_b = walletUserId[0]) === null || _b === void 0 ? void 0 : _b.referrer_id,
                    amount: amountToTransfer,
                    type: types_1.Type.CREDIT,
                });
            }
            const adminDetails = await (0, db_1.default)("users")
                .where({ emailId: "anudeep4n@gmail.com" })
                .returning("*");
            await (0, db_1.default)("wallet_history").insert({
                id: (0, uuid_1.v4)(),
                user_id: (_c = adminDetails[0]) === null || _c === void 0 ? void 0 : _c.id,
                amount: finallyCompanywallet,
                type: types_1.Type.CREDIT,
            });
        };
    }
}
exports.NetworkController = NetworkController;
//# sourceMappingURL=controller.js.map