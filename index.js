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
const axios_1 = require("axios");
const googleUtils_1 = require("./googleUtils");
const axios = require('axios');
const api = "http://94.103.91.4:5000";
const axiosInstance = axios.create({
    baseURL: `${api}`,
    timeout: 1000,
});
function handleError(error) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (error instanceof axios_1.AxiosError) {
            console.error('Ошибка выполнения запроса:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        }
        else if (error instanceof Error) {
            console.error('Ошибка:', error.message);
        }
        else {
            console.error('Неизвестная ошибка:', error);
        }
    });
}
function setAuthorizationHeader(user) {
    if (user.token) {
        axiosInstance.defaults.headers['Authorization'] = `${user.token}`;
    }
    else {
        console.error('Токен недоступен в объекте пользователя.');
    }
}
function register(username) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axiosInstance.post('/auth/registration', { username });
            const data = response.data;
            console.log('Регистрация успешна:', data);
            return data.token;
        }
        catch (error) {
            yield handleError(error);
            return undefined;
        }
    });
}
function login(user) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axiosInstance.post('/auth/login', { username: user.username });
            const data = response.data;
            console.log('Вход успешен:', data);
            return data.token;
        }
        catch (error) {
            yield handleError(error);
            return undefined;
        }
    });
}
function getClients(user, offset, limit) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!user.token) {
            console.error('Токен отстутствует в объекте пользователя.');
            return undefined;
        }
        setAuthorizationHeader(user);
        try {
            const response = yield axiosInstance.get('/clients', {
                params: { limit, offset },
            });
            const clients = response.data;
            if (!clients || clients.length === 0) {
                return [];
            }
            console.log('Данные клиентов получены в количестве:', clients.length);
            return clients;
        }
        catch (error) {
            yield handleError(error);
            return undefined;
        }
    });
}
function getClientsStatus(userIds, token) {
    return __awaiter(this, void 0, void 0, function* () {
        setAuthorizationHeader({ username: "", token });
        try {
            const response = yield axiosInstance.post('/clients', { userIds });
            console.log('Статусы клиентов получены');
            return response.data;
        }
        catch (error) {
            yield handleError(error);
            return undefined;
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const username = "someusername";
        try {
            const user = { username: username };
            user.token = yield login(user);
            if (!user.token) {
                throw new Error('Не удалось получить токен');
            }
            let allClients = [];
            let offset = 0;
            const limit = 1000;
            while (true) {
                const clients = yield getClients(user, offset, limit);
                if (!clients || clients.length === 0) {
                    break;
                }
                const userIds = clients.map((client) => client.id);
                const clientsStatuses = yield getClientsStatus(userIds, user.token);
                if (!clientsStatuses) {
                    throw new Error('Не удалось получить статусы клиентов');
                }
                const clientsWithStatuses = clients.map((client) => {
                    const clientStatus = clientsStatuses.find((status) => status.id === client.id);
                    return Object.assign(Object.assign({}, client), { status: clientStatus ? clientStatus.status : 'Unknown' });
                });
                allClients = allClients.concat(clientsWithStatuses);
                if (clients.length < limit) {
                    break;
                }
                offset += limit;
            }
            console.log('Данные получены:', allClients.length);
            const spreadsheetId = yield (0, googleUtils_1.getSpreadsheetId)();
            yield (0, googleUtils_1.makeSpreadsheetPublic)(googleUtils_1.drive, spreadsheetId);
            yield (0, googleUtils_1.clearSpreadsheet)(spreadsheetId, googleUtils_1.serviceAccountAuth);
            yield (0, googleUtils_1.insertDataIntoSpreadsheet)(spreadsheetId, googleUtils_1.serviceAccountAuth, allClients);
        }
        catch (error) {
            yield handleError(error);
        }
    });
}
main();
