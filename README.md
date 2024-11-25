# Проект

Получает данные с API, загружает их в создаваемую таблицу в Google Spreadsheets (если нет ID существуещей таблицы в .env файле)

## Требования

- Node.js v20

Создать .env файл, с содержанием вида:
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=""
GOOGLE_PRIVATE_KEY=""
SPREADSHEET_ID=""
```

Информацию как создать Google Service и получить к нему приватный ключ можно найти на: https://theoephraim.github.io/node-google-spreadsheet/#/guides/authentication
## Запуск
```bash
npm install
npx tsc
node index.js
```

### Загрузка в гугл таблицу может занять некоторое время

Пример созданной таблицы: https://docs.google.com/spreadsheets/d/1en8PfVRMwuMoMXRKbSEf-ivAqCFKgCo7yiR2x7Qo73M
