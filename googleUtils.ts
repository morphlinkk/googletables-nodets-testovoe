const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const { google } = require('googleapis');
import { Client } from "./types";

require('dotenv').config();

if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    throw new Error('Отсутствуют параметры окружения GOOGLE_PRIVATE_KEY и/или GOOGLE_SERVICE_ACCOUNT_EMAIL');
}

export const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY,
    scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets'
    ],
});

export const createSpreadsheet = async (drive:any) => {
    const fileMetadata = {
        name: 'Clients',
        mimeType: 'application/vnd.google-apps.spreadsheet',
    };

    const response = await drive.files.create({
        resource: fileMetadata,
        fields: 'id',
    });

    console.log('Создана таблица с ID:', response.data.id);
    return response.data.id;
};

export const makeSpreadsheetPublic = async (drive:any, spreadsheetId:string) => {
    await drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
            role: 'reader',
            type: 'anyone',
        }
    });

    console.log(`Таблица с ID ${spreadsheetId} теперь публична.`);
};

export const insertDataIntoSpreadsheet = async (spreadsheetId:string, serviceAccountAuth: typeof JWT, data: Client[]) => {
    const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
    await doc.loadInfo();
    console.log('Название таблицы:', doc.title);

    const sheet = doc.sheetsByIndex[0];

    await sheet.setHeaderRow([
        'id', 'firstName', 'lastName', 'gender', 'address', 'city', 'phone', 'email', 'status'
    ]);

    await sheet.addRows(data);
    console.log('Данные успешно загружены в таблицу.');
};

export const drive = google.drive({ version: 'v3', auth: serviceAccountAuth });

export const getSpreadsheetId = async () => {
    return process.env.SPREADSHEET_ID || await createSpreadsheet(drive);
};

export const clearSpreadsheet = async (spreadsheetId: string, serviceAccountAuth: typeof JWT) => {
    const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    await sheet.clear();
    console.log('Таблица очищена.');
};
