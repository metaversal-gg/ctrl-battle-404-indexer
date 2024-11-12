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
var dotenv = require("dotenv");
var https = require("https");
dotenv.config();
var promises_1 = require("timers/promises");
// Create a custom HTTPS agent that ignores SSL certificate errors
var httpsAgent = new https.Agent({
    rejectUnauthorized: false
});
function updateData() {
    return __awaiter(this, void 0, void 0, function () {
        var currentBlockResponse, currentBlock, limit, offset, allItems, hasMore, response, data, error_1, _i, allItems_1, item, inscriptionId, output, owner, listed, listedAt, matchingRow, row, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 18, , 19]);
                    console.log('Script execution started');
                    return [4 /*yield*/, axios_1.default.get('https://blockchain.info/q/getblockcount', { httpsAgent: httpsAgent })];
                case 1:
                    currentBlockResponse = _a.sent();
                    currentBlock = currentBlockResponse.data;
                    if (currentBlock < parseInt(process.env.START_BLOCK || '0')) {
                        console.log("Current block is ".concat(currentBlock, ", less than ").concat(process.env.START_BLOCK, "."));
                        return [2 /*return*/];
                    }
                    limit = 100;
                    offset = 0;
                    allItems = [];
                    hasMore = true;
                    _a.label = 2;
                case 2:
                    if (!hasMore) return [3 /*break*/, 8];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 6, , 7]);
                    return [4 /*yield*/, (0, promises_1.setTimeout)(500)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, axios_1.default.get('https://api-mainnet.magiceden.dev/v2/ord/btc/tokens', {
                            headers: {
                                Authorization: "Bearer ".concat(process.env.ME_BEARER_TOKEN),
                            },
                            params: {
                                collectionSymbol: 'seizectrl',
                                limit: limit,
                                offset: offset,
                            },
                            httpsAgent: httpsAgent,
                        })];
                case 5:
                    response = _a.sent();
                    data = response.data;
                    allItems = allItems.concat(data.tokens);
                    // Check if we have retrieved all items
                    if (data.tokens.length < limit) {
                        hasMore = false;
                    }
                    else {
                        offset += limit;
                    }
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    if (error_1.response && error_1.response.status === 404) {
                        hasMore = false;
                    }
                    else {
                        throw error_1;
                    }
                    return [3 /*break*/, 7];
                case 7: return [3 /*break*/, 2];
                case 8:
                    _i = 0, allItems_1 = allItems;
                    _a.label = 9;
                case 9:
                    if (!(_i < allItems_1.length)) return [3 /*break*/, 17];
                    item = allItems_1[_i];
                    inscriptionId = item.id;
                    output = item.output;
                    owner = item.owner;
                    listed = item.listed;
                    listedAt = item.listedAt;
                    return [4 /*yield*/, db_1.default.query("SELECT * FROM \"battleOf404\" WHERE \"inscriptionId\" = $1 AND owner = $2 AND utxo = $3 AND \"endBlock\" IS NULL", [inscriptionId, owner, output])];
                case 10:
                    matchingRow = _a.sent();
                    if (!(matchingRow.rows.length === 0 && !listed)) return [3 /*break*/, 12];
                    // If no matching row exists and the item is not listed, create a new row
                    return [4 /*yield*/, db_1.default.query("INSERT INTO \"battleOf404\"(id, created_at, updated_at, deleted_at, \"inscriptionId\", owner, utxo, \"endAction\", \"endBlock\", details, \"startBlock\")\n           VALUES (DEFAULT, NOW(), NOW(), NULL, $1, $2, $3, NULL, NULL, NULL, $4)", [inscriptionId, owner, output, currentBlock])];
                case 11:
                    // If no matching row exists and the item is not listed, create a new row
                    _a.sent();
                    console.log("Inserted new row for unlisted inscriptionId: ".concat(inscriptionId));
                    return [3 /*break*/, 16];
                case 12:
                    if (!(matchingRow.rows.length > 0)) return [3 /*break*/, 16];
                    row = matchingRow.rows[0];
                    if (!(output !== row.utxo)) return [3 /*break*/, 14];
                    return [4 /*yield*/, db_1.default.query("UPDATE \"battleOf404\"\n             SET \"endBlock\" = $1, \"endAction\" = 'transfer', details = $2, updated_at = NOW()\n             WHERE \"inscriptionId\" = $3 AND \"endBlock\" IS NULL", [currentBlock, output, inscriptionId])];
                case 13:
                    _a.sent();
                    console.log("Updated row for inscriptionId: ".concat(inscriptionId, " (transfer)"));
                    _a.label = 14;
                case 14:
                    if (!(listed === true)) return [3 /*break*/, 16];
                    return [4 /*yield*/, db_1.default.query("UPDATE \"battleOf404\"\n             SET \"endBlock\" = $1, \"endAction\" = 'listed', details = $2, updated_at = NOW()\n             WHERE \"inscriptionId\" = $3 AND \"endBlock\" IS NULL", [currentBlock, listedAt, inscriptionId])];
                case 15:
                    _a.sent();
                    console.log("Updated row for inscriptionId: ".concat(inscriptionId, " (listed)"));
                    _a.label = 16;
                case 16:
                    _i++;
                    return [3 /*break*/, 9];
                case 17:
                    console.log('Data updated successfully');
                    db_1.default.end();
                    return [3 /*break*/, 19];
                case 18:
                    error_2 = _a.sent();
                    console.error('An error occurred:', error_2);
                    db_1.default.end();
                    process.exit(1);
                    return [3 /*break*/, 19];
                case 19: return [2 /*return*/];
            }
        });
    });
}
updateData();
