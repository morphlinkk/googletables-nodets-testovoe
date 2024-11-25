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
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearSpreadsheet = exports.getSpreadsheetId = exports.drive = exports.insertDataIntoSpreadsheet = exports.makeSpreadsheetPublic = exports.createSpreadsheet = exports.serviceAccountAuth = void 0;
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const { google } = require('googleapis');
require('dotenv').config();
if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    throw new Error('Отсутствуют параметры окружения GOOGLE_PRIVATE_KEY и/или GOOGLE_SERVICE_ACCOUNT_EMAIL');
}
exports.serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY,
    scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets'
    ],
});
const createSpreadsheet = (drive) => __awaiter(void 0, void 0, void 0, function* () {
    const fileMetadata = {
        name: 'Clients',
        mimeType: 'application/vnd.google-apps.spreadsheet',
    };
    const response = yield drive.files.create({
        resource: fileMetadata,
        fields: 'id',
    });
    console.log('Создана таблица с ID:', response.data.id);
    return response.data.id;
});
exports.createSpreadsheet = createSpreadsheet;
const makeSpreadsheetPublic = (drive, spreadsheetId) => __awaiter(void 0, void 0, void 0, function* () {
    yield drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
            role: 'reader',
            type: 'anyone',
        }
    });
    console.log(`Таблица с ID ${spreadsheetId} теперь публична.`);
});
exports.makeSpreadsheetPublic = makeSpreadsheetPublic;
const insertDataIntoSpreadsheet = (spreadsheetId, serviceAccountAuth, data) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
    yield doc.loadInfo();
    console.log('Название таблицы:', doc.title);
    const sheet = doc.sheetsByIndex[0];
    yield sheet.setHeaderRow([
        'id', 'firstName', 'lastName', 'gender', 'address', 'city', 'phone', 'email', 'status'
    ]);
    yield sheet.addRows(data);
    console.log('Данные успешно загружены в таблицу.');
});
exports.insertDataIntoSpreadsheet = insertDataIntoSpreadsheet;
exports.drive = google.drive({ version: 'v3', auth: exports.serviceAccountAuth });
const getSpreadsheetId = () => __awaiter(void 0, void 0, void 0, function* () {
    return process.env.SPREADSHEET_ID || (yield (0, exports.createSpreadsheet)(exports.drive));
});
exports.getSpreadsheetId = getSpreadsheetId;
const clearSpreadsheet = (spreadsheetId, serviceAccountAuth) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
    yield doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    yield sheet.clear();
    console.log('Таблица очищена.');
});
exports.clearSpreadsheet = clearSpreadsheet;
