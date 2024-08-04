"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || 'SAI_RAM';
const authenticate = async (ctx, next) => {
    var _a;
    const token = (_a = ctx.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    if (!token) {
        ctx.body = "Authentication token is required";
        ctx.status = 401;
        return;
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        ctx.state.userPayload = decoded.userPayload;
        await next();
    }
    catch (err) {
        ctx.body = "Invalid or expired token";
        ctx.status = 401;
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=middleware.js.map