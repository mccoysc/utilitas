import * as shell from './shell.mjs';
import * as utilitas from './utilitas.mjs';
import fetch from 'node-fetch';
import geoIp from 'fast-geoip';
import libPing from 'ping';
import publicIp from 'public-ip';

const log = (content) => { return utilitas.modLog(content, 'network'); };

const ping = async (host, options = { timeout: 3, min_reply: 3 }) => {
    await shell.assertExist('ping');
    return await libPing.promise.probe(host, options);
};

const pickFastestHost = async (hosts, options = {}) => {
    let [reqHosts, pingResp, pasResp, result]
        = [utilitas.ensureArray(hosts), [], [], null];
    reqHosts.map(x => {
        try { x = new URL(x).hostname; } catch (e) { }
        pingResp.push(ping(x));
    });
    pingResp = await Promise.all(pingResp);
    pingResp.map(x => {
        if (x.alive) { pasResp.push(x); }
        if (options.debug) {
            let logs = [];
            for (let i in x) {
                if (!['output', 'times', 'stddev'].includes(i)) {
                    logs.push(`${i}: ${x[i]}`);
                }
            }
            log(`ping > ${logs.join(', ')}`);
        }
    });
    if (pingResp.length && pasResp.length) {
        pasResp.sort((x, y) => {
            return Number(x.packetLoss) - Number(y.packetLoss)
                || Number(x.avg) - Number(y.avg);
        });
        for (let x of reqHosts) {
            if (x.includes(pasResp[0].host)) { result = x; break; }
        }
    }
    if (!result) {
        if (options.forcePick) { result = reqHosts[0]; } else {
            utilitas.throwError('All hosts cannot be connected.', 500);
        }
    }
    if (options.debug) { log(`picked > ${result}`); }
    return result;
};

const httping = async (url, options = { timeout: 3 }) => { // @todo: timeout
    let [response, error, stTime] = [null, null, new Date()];
    try { response = await fetch(url); } catch (e) { error = e; }
    return {
        url, response, error, response_time: error ? null : new Date() - stTime
    };
};

const pickFastestHttpServer = async (urls, options = {}) => {
    urls = utilitas.ensureArray(urls);
    const resp = await Promise.all(urls.map(u => { return httping(u); }));
    const result = [];
    resp.map(x => {
        try { delete r.response; } catch (e) { }
        let logs = [];
        if (options.debug) {
            for (let i in x) {
                if (!['error', 'response'].includes(i)) {
                    logs.push(`${i}: ${x[i]}`);
                }
            }
            log(`httping > ${logs.join(', ')}`);
        }
        if (!x.error) { result.push(x); }
    });
    result.sort((x, y) => { return x.response_time - y.response_time; });
    let pick = result.length ? result[0].url : null;
    if (!pick) {
        if (options.forcePick) { pick = urls[0]; } else {
            utilitas.throwError('All hosts cannot be connected.', 500);
        }
    }
    if (options.debug) { log(`picked > ${pick}`); }
    return pick;
};

const getCurrentPosition = async () => {
    const ip = await publicIp.v4();
    utilitas.assert(ip, 'Network is unreachable.', 500);
    const loc = await geoIp.lookup(ip);
    utilitas.assert(loc, 'Error detecting geolocation.', 500);
    return Object.assign(loc, { ip });
};

export {
    getCurrentPosition,
    httping,
    pickFastestHost,
    pickFastestHttpServer,
    ping,
};
