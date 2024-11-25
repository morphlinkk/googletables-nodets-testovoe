import { AxiosError } from "axios";
import { insertDataIntoSpreadsheet, getSpreadsheetId, serviceAccountAuth, makeSpreadsheetPublic, drive, clearSpreadsheet } from "./googleUtils";

interface User {
    username: string;
    token?: string;
}

const axios = require('axios');

const api = "http://94.103.91.4:5000";

const axiosInstance = axios.create({
    baseURL: `${api}`,
    timeout: 1000,
});

async function handleError(error: unknown) {
    if (error instanceof AxiosError) {
        console.error('Ошибка выполнения запроса:', error.response?.data || error.message);
    } else if (error instanceof Error) {
        console.error('Ошибка:', error.message);
    } else {
        console.error('Неизвестная ошибка:', error);
    }
}

function setAuthorizationHeader(user: User) {
    if (user.token) {
        axiosInstance.defaults.headers['Authorization'] = `${user.token}`;
    } else {
        console.error('Токен недоступен в объекте пользователя.');
    }
}

async function register(username: string): Promise<string | undefined> {
    try {
        const response = await axiosInstance.post('/auth/registration', { username });
        const data = response.data;
        console.log('Регистрация успешна:', data);
        return data.token;
    } catch (error: unknown) {
        await handleError(error);
        return undefined;
    }
}

async function login(user: User): Promise<string | undefined> {
    try {
        const response = await axiosInstance.post('/auth/login', { username: user.username });
        const data = response.data;
        console.log('Вход успешен:', data);
        return data.token;
    } catch (error: unknown) {
        await handleError(error);
        return undefined;
    }
}

async function getClients(user: User, offset: number, limit: number): Promise<any[] | undefined> {
    if (!user.token) {
        console.error('Токен отстутствует в объекте пользователя.');
        return undefined;
    }

    setAuthorizationHeader(user);

    try {
        const response = await axiosInstance.get('/clients', {
            params: { limit, offset },
        });

        const clients = response.data;
        if (!clients || clients.length === 0) {
            return [];
        }

        console.log('Данные клиентов получены в количестве:', clients.length);
        return clients;
    } catch (error: unknown) {
        await handleError(error);
        return undefined;
    }
}

async function getClientsStatus(userIds: number[], token: string): Promise<any | undefined> {
    setAuthorizationHeader({ username: "", token });

    try {
        const response = await axiosInstance.post('/clients', { userIds });
        console.log('Статусы клиентов получены');
        return response.data;
    } catch (error: unknown) {
        await handleError(error);
        return undefined;
    }
}

async function main() {
    const username = "someusername";

    try {
        const user: User = { username: username };

        user.token = await login(user);
        if (!user.token) {
            throw new Error('Не удалось получить токен');
        }

        let allClients: any[] = [];
        let offset = 0;
        const limit = 1000;

        while (true) {
            const clients = await getClients(user, offset, limit);
            if (!clients || clients.length === 0) {
                break;
            }

            const userIds: number[] = clients.map((client: { id: number }) => client.id);
            const clientsStatuses = await getClientsStatus(userIds, user.token);
            if (!clientsStatuses) {
                throw new Error('Не удалось получить статусы клиентов');
            }

            const clientsWithStatuses = clients.map((client: any) => {
                const clientStatus = clientsStatuses.find((status: any) => status.id === client.id);
                return {
                    ...client,
                    status: clientStatus ? clientStatus.status : 'Unknown',
                };
            });

            allClients = allClients.concat(clientsWithStatuses);

            if (clients.length < limit) {
                break;
            }

            offset += limit;
        }

        console.log('Данные получены:', allClients.length);

        const spreadsheetId = await getSpreadsheetId();
        await makeSpreadsheetPublic(drive, spreadsheetId);
        await clearSpreadsheet(spreadsheetId, serviceAccountAuth)
        await insertDataIntoSpreadsheet(spreadsheetId, serviceAccountAuth, allClients);
    } catch (error: unknown) {
        await handleError(error);
    }
}

main();
