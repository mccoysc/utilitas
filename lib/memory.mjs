import {
    deleteAll, deleteById, query, queryAll, queryById, upsert
} from './dbio.mjs';

import { ensureArray, parseJson, trim } from './utilitas.mjs';

const [table, defaultKey] = ['utilitas_memory', { key: 'key' }];
const [pack, unpack] = [val => JSON.stringify(val), val => parseJson(val, val)];

const init = async () => {
    const _result = await query(
        `CREATE TABLE IF NOT EXISTS ?? (
        \`key\`       VARCHAR(255) NOT NULL,
        \`value\`     TEXT,
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`key\`),
        INDEX (\`value\`(768)),
        INDEX (\`createdAt\`),
        INDEX (\`updatedAt\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, [table]
    );
    return { del, get, set, _result };
};

const assertKey = (key, options) => {
    key = trim(key, { case: 'UP' });
    assert(options?.ignoreError || key, 'Invalid memory key.', 400);
    return key;
};

const handleResult = (resp, options) => {
    if (!options?.skipEcho) {
        ensureArray(resp).map(x => { x.value = unpack(x.value); });
        let result = {};
        if (Array.isArray(resp)) {
            for (let i in resp) { result[resp[i].key] = resp[i].value; }
        } else { result = resp?.value; }
        resp = result;
    }
    return resp;
};

const set = async (key, value, options) => {
    options = { skipEcho: true, ...options || {}, ...defaultKey };
    return handleResult(await upsert(table, {
        key: assertKey(key), value: pack(value), updatedAt: new Date()
    }, options), options);
};

const get = async (key, options) => {
    options = { ...options || {}, ...defaultKey };
    return handleResult(await ((key = assertKey(key, { ignoreError: true }))
        ? queryById(table, key, options) : queryAll(table, options)), options);
};

const del = async (key, options) => {
    options = { ...options || {}, ...defaultKey };
    return await ((key = assertKey(key, { ignoreError: options?.force }))
        ? deleteById(table, key, options) : deleteAll(table, options));
};

export { del, get, init, set };
