// dependencies
import { default as colors } from 'colors/safe.js';
import { default as fetch } from 'node-fetch';
import { default as formData } from 'form-data';
import { default as mailgun } from 'mailgun.js';
import { default as mailjet } from 'node-mailjet';
import { Tail as tail } from 'tail';
import * as base64url from 'base64url';
import * as fileType from 'file-type';
import * as geoIp from 'fast-geoip';
import * as ini from 'ini';
import * as jwt from 'jsonwebtoken';
import * as math from 'mathjs';
import * as mysql from 'mysql2/promise';
import * as ping from 'ping';
import * as qs from 'qs';
import * as redis from 'ioredis';
import * as sentry from '@sentry/node';
import * as telegraf from 'telegraf';
import * as telesign from 'telesignsdk';
import * as twilio from 'twilio';
import * as uuid from 'uuid';
// features
import * as bot from './lib/bot.mjs';
import * as cache from './lib/cache.mjs';
import * as dbio from './lib/dbio.mjs';
import * as email from './lib/email.mjs';
import * as encryption from './lib/encryption.mjs';
import * as event from './lib/event.mjs';
import * as network from './lib/network.mjs';
import * as sentinel from './lib/sentinel.mjs';
import * as shell from './lib/shell.mjs';
import * as shot from './lib/shot.mjs';
import * as sms from './lib/sms.mjs';
import * as storage from './lib/storage.mjs';
import * as tape from './lib/tape.mjs';
import * as uoid from './lib/uoid.mjs';
import * as utilitas from './lib/utilitas.mjs';
// import manifest from './package.json' assert { type: 'json' };
// https://www.stefanjudis.com/snippets/how-to-import-json-files-in-es-modules-node-js/
import { default as manifest } from './manifest.mjs';

// Export
export * as default from './lib/utilitas.mjs';
export {
    // dependencies
    base64url, colors, fetch, fileType, formData, geoIp, ini, jwt, mailgun,
    mailjet, math, mysql, ping, qs, redis, sentry, tail, telegraf, telesign,
    twilio, uuid,
    // features
    bot, cache, dbio, email, encryption, event, manifest, network, sentinel,
    shell, shot, sms, storage, tape, uoid, utilitas,
};

if (utilitas.inBrowser()) {
    window.utilitas = {
        base64url, colors, encryption, event, fetch, fileType, formData, ini,
        jwt, manifest, math, network, qs, shell, shot, storage, uoid, utilitas,
        uuid,
    };
    console.log(`[${manifest.name.toUpperCase()} ${manifest.version}](${manifest.homepage}) is ready!`);
}
