"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var db_1 = require("../lib/db");
var axios_1 = require("axios");
function updateData() {
    return __awaiter(this, void 0, void 0, function () {
        var currentBlockResponse, currentBlock, limit, offset, allItems, hasMore, response, data, error_1, _i, allItems_1, item, inscriptionId, output, listed, listedAt, res, row, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 15, , 16]);
                    console.log('Script execution started');
                    return [4 /*yield*/, axios_1.default.get('https://blockchain.info/q/getblockcount')];
                case 1:
                    currentBlockResponse = _a.sent();
                    currentBlock = currentBlockResponse.data;
                    limit = 100;
                    offset = 0;
                    allItems = [];
                    hasMore = true;
                    _a.label = 2;
                case 2:
                    if (!hasMore) return [3 /*break*/, 7];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, axios_1.default.get('https://api-mainnet.magiceden.dev/v2/ord/btc/tokens', {
                            headers: {
                                Authorization: "Bearer ".concat(process.env.ME_BEARER_TOKEN),
                            },
                            params: {
                                collectionSymbol: 'seizectrl',
                                limit: limit,
                                offset: offset,
                            },
                        })];
                case 4:
                    response = _a.sent();
                    data = response.data;
                    allItems = allItems.concat(data.items);
                    // Check if we have retrieved all items
                    if (data.items.length < limit) {
                        hasMore = false;
                    }
                    else {
                        offset += limit;
                    }
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    if (error_1.response && error_1.response.status === 404) {
                        hasMore = false;
                    }
                    else {
                        throw error_1;
                    }
                    return [3 /*break*/, 6];
                case 6: return [3 /*break*/, 2];
                case 7:
                    _i = 0, allItems_1 = allItems;
                    _a.label = 8;
                case 8:
                    if (!(_i < allItems_1.length)) return [3 /*break*/, 14];
                    item = allItems_1[_i];
                    inscriptionId = item.id;
                    output = item.output;
                    listed = item.listed;
                    listedAt = item.listedAt;
                    return [4 /*yield*/, db_1.default.query("SELECT * FROM main_index WHERE \"inscriptionId\" = $1 AND \"endBlock\" IS NULL", [inscriptionId])];
                case 9:
                    res = _a.sent();
                    if (!(res.rows.length > 0)) return [3 /*break*/, 13];
                    row = res.rows[0];
                    if (!(output !== row.utxo)) return [3 /*break*/, 11];
                    return [4 /*yield*/, db_1.default.query("UPDATE main_index\n             SET \"endBlock\" = $1, \"endAction\" = 'transfer', details = $2\n             WHERE \"inscriptionId\" = $3", [currentBlock, output, inscriptionId])];
                case 10:
                    _a.sent();
                    _a.label = 11;
                case 11:
                    if (!(listed === true)) return [3 /*break*/, 13];
                    return [4 /*yield*/, db_1.default.query("UPDATE main_index\n             SET \"endBlock\" = $1, \"endAction\" = 'listed', details = $2\n             WHERE \"inscriptionId\" = $3", [currentBlock, listedAt, inscriptionId])];
                case 12:
                    _a.sent();
                    _a.label = 13;
                case 13:
                    _i++;
                    return [3 /*break*/, 8];
                case 14:
                    console.log('Data updated successfully');
                    db_1.default.end(); // Close the database connection
                    return [3 /*break*/, 16];
                case 15:
                    error_2 = _a.sent();
                    console.error('An error occurred:', error_2);
                    db_1.default.end(); // Ensure the database connection is closed
                    process.exit(1); // Exit with an error code
                    return [3 /*break*/, 16];
                case 16: return [2 /*return*/];
            }
        });
    });
}
updateData();
