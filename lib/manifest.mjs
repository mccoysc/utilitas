const manifest = {
    "name": "utilitas",
    "description": "Just another common utility for Node.js.",
    "version": "1989.10.14",
    "private": false,
    "homepage": "https://github.com/Leask/utilitas",
    "main": "index.mjs",
    "type": "module",
    "engines": {
        "node": ">=16.x"
    },
    "scripts": {
        "start": "node index.mjs",
        "debug": "node --inspect --trace-warnings debug.mjs",
        "test": "node --inspect --trace-warnings test.mjs",
        "ncuinit": "npm install -g npm-check-updates",
        "updep": "npx ncu -u && npm install && ( git commit -am 'update dependencies' || true )",
        "gitsync": "git pull && git push",
        "build": "npm run updep && npm version patch && node build.mjs && ./node_modules/.bin/webpack-cli --config webpack.config.mjs",
        "prepublishOnly": "npm run build && npm run gitsync"
    },
    "author": "Leask Wong <i@leaskh.com>",
    "license": "MIT",
    "repository": {
        "type": "git",
        "url": "https://github.com/Leask/utilitas.git"
    },
    "dependencies": {
        "@sentry/node": "^6.19.1",
        "base64url": "^3.0.1",
        "colors": "1.4.0",
        "fast-geoip": "^1.1.63",
        "file-type": "^17.1.1",
        "form-data": "^4.0.0",
        "ini": "github:Leask/ini",
        "ioredis": "^4.28.5",
        "jsonwebtoken": "^8.5.1",
        "mailgun.js": "^5.0.2",
        "mathjs": "^10.4.0",
        "mysql2": "^2.3.3",
        "node-fetch": "^3.2.3",
        "node-mailjet": "^3.3.7",
        "ping": "^0.4.1",
        "tail": "^2.2.4",
        "telegraf": "^4.7.0",
        "telesignsdk": "^2.2.1",
        "twilio": "^3.75.1",
        "uuid": "^8.3.2"
    },
    "devDependencies": {
        "browserify-fs": "^1.0.0",
        "node-polyfill-webpack-plugin": "^1.1.4",
        "webpack-cli": "^4.9.2"
    }
};

export default manifest;