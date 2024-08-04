"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueId = void 0;
const generateUniqueId = () => {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};
exports.generateUniqueId = generateUniqueId;
//# sourceMappingURL=helper.js.map