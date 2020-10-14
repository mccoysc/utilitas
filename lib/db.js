'use strict';

const fieldId = 'id';
const fieldAny = '*';
const fieldCount = `COUNT(${fieldAny})`;
const fieldNoQuote = [fieldAny, fieldCount];

let pool = null;

const log = (content) => { return utilitas.modLog(content, __filename); };

const init = (options) => {
    if (options) {
        pool = mysql.createPool(options);
        log(`Initialized: ${options.user}@${options.host}`
            + `:${options.port}/${options.database}`);
    }
    utilitas.assert(pool, 'Database has not been initialized.', 501);
    return pool;
};

const logCommand = (args) => {
    if (~~global.debug > 0 && args && args[0]) { log(`SQL: ${args[0]}`); }
    if (~~global.debug > 1 && args && args[1]) { console.log(args[1]); };
};

const rawQuery = async function() {
    const conn = init();
    logCommand(arguments);
    return await conn.query.apply(conn, [...arguments]);
};

const rawExecute = async function() {
    const conn = init();
    logCommand(arguments);
    return await conn.execute.apply(conn, [...arguments]);
};

const query = async function() {
    return (await rawQuery.apply(null, [...arguments]))[0];
};

const execute = async function() {
    return (await rawExecute.apply(null, [...arguments]))[0];
};

const defaultKey = (options) => {
    return options && options.key ? options.key : fieldId;
};

const assertTable = (table, message = 'Table is required.', status = 500) => {
    utilitas.assert(table, message, status);
};

const assertKeyValue = (key, value) => {
    utilitas.assert(key, 'Key is required.', 500);
    utilitas.assertSet(value, 'Value is required.', 500);
};

// const assertTableKeyValue = (table, key, value) => {
//     assertTable(table);
//     assertKeyValue(key, value);
// };

const assembleQuery = (table, options) => {
    options = options || {};
    assertTable(table);
    const fields = [];
    utilitas.ensureArray(options.fields).map((field) => {
        fields.push(fieldNoQuote.includes(field) || options.noQuote
            ? field : `\`${field}\``);
    });
    if (!fields.length) { fields.push(fieldAny); }
    return `SELECT ${fields.join(', ')} FROM \`${table}\``;
};

const rawAssembleKeyValue = (key, value, options) => {
    options = options || {};
    assertKeyValue(key, value);
    let express = '= ?';
    if (Array.isArray(value)) {
        express = 'IN (?)';
    } else if (value === null) {
        express = 'IS ?';
    }
    return `${options.prefix || ''}\`${key}\` ${express}`;
};

const assembleKeyValue = (key, value, options) => {
    options = options || {};
    options.prefix = ' WHERE ';
    return rawAssembleKeyValue(key, value, options);
};

const assembleSet = (data, options) => {
    options = options || {};
    const [isArray, result] = [options.asArray || Array.isArray(data), []];
    utilitas.ensureArray(data).map((item) => {
        utilitas.assert(Object.keys(item).length, 'Fields are required.', 500);
        const [sql, values] = [[], []];
        for (let k in item) { sql.push(`\`${k}\` = ?`); values.push(item[k]); }
        result.push({
            sql: `${options.prefix || ''}SET ${sql.join(', ')}`,
            values, object: item,
        });
    });
    return isArray ? result : result[0];
};

const assembleUpdate = (table, data, options) => {
    options = options || {};
    assertTable(table);
    options.prefix = `UPDATE \`${table}\` `;
    return assembleSet(data, options);
};

const assembleDelete = (table) => {
    assertTable(table);
    return `DELETE FROM \`${table}\``;
};

const queryAll = async (table, options) => {
    return await query(assembleQuery(table, options));
};

const queryByKeyValue = async (table, key, value, options) => {
    options = options || {};
    const s = `${assembleQuery(table, options)}${assembleKeyValue(key, value)}`;
    const resp = await query(s, [value]);
    return options.unique ? (resp && resp.length ? resp[0] : null) : resp;
};

const queryById = async (table, id, options) => {
    options = options || {};
    options.unique = !Array.isArray(id);
    return await queryByKeyValue(table, defaultKey(options), id, options);
};

const insert = async (table, fields, options) => {
    options = options || {};
    assertTable(table);
    let [isArray, key, ids, error, result, sql] = [
        Array.isArray(fields), defaultKey(options), [], [], [],
        `INSERT INTO \`${table}\``
    ];
    for (let item of assembleSet(fields, { asArray: true })) {
        try {
            const resp = await execute(`${sql}${item.sql}`, item.values);
            resp.key = key;
            resp.insertId = !resp.insertId && item.object[key]
                ? item.object[key] : resp.insertId;
            result.push(resp);
            ids.push(resp.insertId);
        } catch (err) { error.push(err); }
    }
    if (!options.skipEcho && ids.length) {
        result = await queryById(table, ids, options);
    }
    if (!isArray) {
        if (error.length) { throw error[0]; }
        return result.length ? result[0] : null;
    }
    return { error, result };
};

const countAll = async (table) => {
    const sql = assembleQuery(table, { fields: fieldCount });
    return (await query(sql))[0][fieldCount];
};

const countByKeyValue = async (table, key, value) => {
    const sql = assembleQuery(table, { fields: fieldCount })
        + assembleKeyValue(key, value);
    return (await query(sql, [value]))[0][fieldCount];
};

const updateByKeyValue = async (table, key, value, fields, options) => {
    options = options || {};
    assertTable(table);
    let { sql, values } = assembleUpdate(table, fields);
    sql += assembleKeyValue(key, value);
    const resp = await query(sql, [...values, value]);
    return options.skipEcho
        ? resp : await queryByKeyValue(table, key, value, options);
};

const updateById = async (table, id, fields, options) => {
    const resp = await updateByKeyValue(
        table, defaultKey(options), id, fields, options
    );
    return Array.isArray(id) ? resp : (resp && resp.length ? resp[0] : null);
};

const deleteByKeyValue = async (table, key, value) => {
    const sql = `${assembleDelete(table)}${assembleKeyValue(key, value)}`;
    return await query(sql, [value]);
};

const deleteById = async (table, id, options) => {
    return await deleteByKeyValue(table, defaultKey(options), id);
};

const deleteAll = async (table, options) => {
    utilitas.assert(options && options.force,
        "Option 'force' is required.", 500);
    return await execute(assembleDelete(table));
};

module.exports = {
    assembleQuery,
    assembleUpdate,
    countAll,
    countByKeyValue,
    deleteAll,
    deleteById,
    deleteByKeyValue,
    execute,
    init,
    insert,
    query,
    queryAll,
    queryById,
    queryByKeyValue,
    rawAssembleKeyValue,
    rawExecute,
    rawQuery,
    updateById,
    updateByKeyValue,
};

const utilitas = require('./utilitas');
const mysql = require('mysql2/promise');