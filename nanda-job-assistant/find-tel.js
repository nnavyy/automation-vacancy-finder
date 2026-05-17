const { PrismaClient } = require('@prisma/client');
const { sendVacancyNotification } = require('./src/lib/telegramClient'); // wait, let me find where it's imported from

const fs = require('fs');
console.log(fs.readFileSync('./src/lib/collectionPipeline.ts', 'utf8').substring(0, 1000));
