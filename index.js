//  -*- coding: utf-8 -*-
//  index.js ---
//  created: 2017-08-11 08:28:28
//

'use strict';

const qs = require('querystring');
let P = Promise;

/**
 * Q.nfcall semantics.
 */
const nfcall = function () {
    let args = Array.prototype.slice.call(arguments);

    return new P((resolve, reject) => {
        let target = args.shift();

        // add node style callback handler as last parameter
        args.push((err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });

        // call the target function
        try {
            target.apply(null, args);
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * @class PromisedHapi
 *
 * Wrapper for Hapi instance to provide promised based helpers for
 * asynchronous Hapi functions.
 */
class PromisedHapi {
    constructor(instance) {
        this.hapi = instance;
    }

    get instance() {
        return this.hapi;
    }

    /**
     * Start hapi server.
     */
    start() {
        return nfcall(this.hapi.start.bind(this.hapi));
    }

    /**
     * Stop hapi server.
     */
    stop(options) {
        options = Object.assign({timeout: 500}, options);
        return nfcall(this.hapi.stop.bind(this.hapi, options));
    }

    /**
     * Send HTTP request without actually going over the network.
     */
    inject(options) {
        return new P(resolve => {
            this.hapi.connections[0].inject(options, resolve);
        });
    }

    register(...args) {
        return nfcall(this.hapi.register.bind(this.hapi, ...args));
    }
}

/**
 * Configure logging with Hapi.
 *
 * @param {hapi.Server} server - Hapi server instance.
 * @param {Winston} [logger] - Winston logger. Basically, this can be any object
 *     with `info()` and `error()` functions.
 * @returns {hapi.Server} Hapi server instance.
 */
exports.setupLogs = function (server, logger, customFormatters={}) {

    function generateRequestLogLine(request) {
        let statusCode = '---';

        if (request.response) {
            statusCode = request.response.statusCode;
        }

        const qssz = qs.unescape(qs.stringify(request.query));
        return `< ${request.method.toUpperCase()} ${request.path}` +
               `${qssz ? ('?' + qssz) : ''} ${statusCode}`;
    }

    if (!logger) {
        return;
    }

    server.on('log', function (event) {
        logger.info(`${event.data}`);
    });
    server.on('request-error', function (request, err) {
        logger.error(`${generateRequestLogLine(request)} ${err.message}`);
    });
    server.on('response', function (request) {
        try {
            if (!request.response || request.response.statusCode >= 400) {
                logger.error(generateRequestLogLine(request));
            } else {
                const frmt = customFormatters[request.path];
                let msg;
                if (frmt) {
                    msg = frmt(request);
                    if (typeof msg === 'undefined') {
                        msg = generateRequestLogLine(request);
                    }
                } else {
                    msg = generateRequestLogLine(request);
                }
                if (msg !== null) {
                    logger.info(msg);
                }
            }
        } catch (e) {
            logger.error('unable to produce log line for API request', e.message);
        }
    });

    return server;
};

exports.setPromiseLib = Pr => P = Pr;
exports.PromisedHapi = PromisedHapi;

//
//  index.js ends here
