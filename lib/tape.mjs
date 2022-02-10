import * as bot from './bot.mjs';
import * as event from './event.mjs';
import * as utilitas from './utilitas.mjs';

// https://github.com/winstonjs/winston#logging-levels
// const levels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
// Handle, report, or silently ignore connection errors and failures
const handleError = (err) => { process.stdout.write(`${err.message}\n`); };
const consoleMap = { log: 'verbose', info: 0, debug: 0, warn: 0, error: 0 };
const [TAPE, maxLength, defBufCycle, maxBufCycle] = ['TAPE', 4096, 10, 100];
const modLog = (content) => { return utilitas.modLog(content, TAPE); };
const getLogger = async () => { return (await init()).logger; };
const BOT = 'BOT';
const getSendTxt = (arr) => { return arr.map(x => x[1]).join('\n'); };
const getSndSize = (arr) => { return getSendTxt(arr).length; };
const getBufSize = () => { return maxLength * bufferCycle; };
const nextLen = () => { return botBuffer?.[0]?.[1].length || (maxLength + 1); };
const handleConnect = (data) => { return silent || modLog(data); };

let chatIds, tarLevel, botBuffer, bufferCycle, logger, silent, provider;

const hookConsole = () => {
    for (let act in consoleMap) {
        const tar = consoleMap[act] || act;
        const bakAct = `_${act}`;
        console[bakAct] = console[act];
        console[act] = function() {
            console[bakAct].apply(console, arguments);
            const str = [...arguments].map(
                utilitas.ensureString
            ).join(' ').replace(/\u001b\[\d+m/g, '').split('');
            while (str.length) {
                const message = str.splice(0, maxLength).join('').trim();
                message.length && logger && logger.log(tar, message);
            }
        };
    }
};

const releaseConsole = () => {
    for (let act in consoleMap) {
        const bakAct = `_${act}`;
        if (!console[bakAct]) { continue; }
        console[act] = console[bakAct];
        delete console[bakAct];
    }
};

const addChatId = (id) => {
    return chatIds && id && !chatIds.includes(id) ? chatIds.push(id) : null;
};

const removeChatId = (id) => {
    return chatIds && id && chatIds.includes(id) ? delete chatIds[id] : false;
};

const botLoggerInit = async (options) => {
    chatIds = utilitas.ensureArray(options?.chatId);
    utilitas.assert(chatIds.length, 'ChatId is required.', 501);
    handleConnect(`Sending logs via bot, chatId: ${chatIds.join(', ')}.`);
    bufferCycle = utilitas.ensureInt(
        options?.bufferCycle || defBufCycle, { min: 1, max: maxBufCycle }
    );
    logger = botLogger;
    await event.loop(
        botLoggerSync, ~~options?.interval || 5, ~~options?.tout || 10,
        ~~options?.delay, TAPE, { silent: true }
    );
    return { logger, dependencies: { bot, event } };
};

const botLoggerSync = async () => {
    let f = [];
    while (getSndSize(f) + nextLen() <= maxLength) { f.push(botBuffer.shift()) }
    if (!(f = getSendTxt(f)).length) { return; };
    for (let id of chatIds) {
        try { await bot.send(id, f); } catch (err) { handleError(err); }
    }
};

const botLogger = {
    end: () => { chatIds = undefined; botBuffer = undefined; event.end(TAPE); },
    log: (level, message) => {
        if (tarLevel !== 'verbose' && level === 'verbose') { return; }
        (botBuffer = botBuffer || []).push([level, message]);
        while (getSndSize(botBuffer) > getBufSize()) { botBuffer.shift(); }
    },
};

// use options.level = 'verbose' to send console.log logs
const init = async (options) => {
    let result;
    if (options) {
        silent = !!options?.silent;
        tarLevel = options?.level;
        provider = utilitas.ensureString(options?.provider, { case: 'UP' });
        switch (provider) {
            case BOT:
                result = await botLoggerInit(options);
                break;
            default:
                utilitas.throwError(
                    `Invalid tape provider: '${options?.provider}'.`, 501
                );
        }
        options.noHook || hookConsole();
    }
    utilitas.assert(logger, 'Logger client has not been initialized.', 501);
    return result;
};

const end = async () => {
    releaseConsole();
    setTimeout(() => { logger?.end?.(); modLog('Terminated.'); }, 1000);
};

export default init;
export {
    addChatId,
    end,
    getLogger,
    init,
    removeChatId,
};
