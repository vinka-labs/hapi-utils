//  -*- coding: utf-8 -*-
//  test-hapi-utils.js ---
//  created: 2017-08-11 08:09:39
//

'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Code = require('code');
const expect = Code.expect;
const hapi = require('hapi');
const Bluebird = require('bluebird');
const sinon = require('sinon');
const hapier = require('../index');

lab.experiment('Hapi utils', function () {
    lab.test('Promised Hapi (bluebird promise)', function (done) {
        hapier.setPromiseLib(Bluebird);
        const prhapi = new hapier.PromisedHapi(new hapi.Server());
        expect(prhapi.instance).to.be.instanceof(hapi.Server);
        prhapi.instance.connection({port: 16666});
        const pr = prhapi.start();
        expect(pr).to.be.instanceof(Bluebird);
        pr.then(() => prhapi.stop()).then(() => {
            hapier.setPromiseLib(Promise);
            done();
        });
    });

    lab.test('Promised Hapi (native promise)', function (done) {
        const prhapi = new hapier.PromisedHapi(new hapi.Server());
        expect(prhapi.instance).to.be.instanceof(hapi.Server);
        prhapi.instance.connection({port: 16666});
        const pr = prhapi.start();
        expect(pr).to.be.instanceof(Promise);
        pr.then(() => prhapi.stop()).then(done);
    });

    lab.experiment('Setup logs without custom formatters', () => {
        const log = {
            info: sinon.stub(),
            error: sinon.stub(),
        };

        const server = new hapi.Server();
        server.connection({host: 'localhost', port: 8080});
        hapier.setupLogs(server, log);
        server.route({method: 'get', path: '/test', handler: (req, rep) => rep('hello')});
        server.route({method: 'get', path: '/err', handler: (req, rep) => rep('hello 500').code(500)});

        lab.beforeEach(done => {
            log.info.reset();
            log.error.reset();
            done();
        });

        lab.test('Call 200 and verify log', async () => {
            const result = await server.inject({method: 'get', url: '/test?hii=hoo'});
            expect(log.info.callCount).to.be.equal(1);
            expect(log.info.getCall(0).args).to.be.equal(['< GET /test?hii=hoo 200']);
            expect(log.error.callCount).to.be.equal(0);
        });

        lab.test('Call 404 and verify log', async () => {
            const result = await server.inject({method: 'get', url: '/dupont'});
            expect(log.info.callCount).to.be.equal(0);
            expect(log.error.callCount).to.be.equal(1);
            expect(log.error.getCall(0).args).to.be.equal(['< GET /dupont 404']);
        });

        lab.test('Call 500 and verify log', async () => {
            const result = await server.inject({method: 'get', url: '/err'});
            expect(log.info.callCount).to.be.equal(0);
            expect(log.error.callCount).to.be.equal(1);
            expect(log.error.getCall(0).args).to.be.equal(['< GET /err 500']);
        });
    });

    lab.experiment('Setup logs with custom formatters', () => {
        const log = {
            info: sinon.stub(),
            error: sinon.stub(),
        };

        const server = new hapi.Server();
        server.connection({host: 'localhost', port: 8080});
        hapier.setupLogs(server, log, {
            '/health': () => 'never mind this',
            '/undefined': () => undefined,
            '/null': () => null,
        });
        server.route({method: 'get', path: '/test', handler: (req, rep) => rep('hello')});
        server.route({method: 'get', path: '/health', handler: (req, rep) => rep('health')});
        server.route({method: 'get', path: '/undefined', handler: (req, rep) => rep('undefined')});
        server.route({method: 'get', path: '/null', handler: (req, rep) => rep('null')});
        server.route({method: 'get', path: '/err', handler: (req, rep) => rep('hello 500').code(500)});

        lab.beforeEach(done => {
            log.info.reset();
            log.error.reset();
            done();
        });

        lab.test('Call 200 and verify log', async () => {
            const result = await server.inject({method: 'get', url: '/test?hii=hoo'});
            expect(log.info.callCount).to.be.equal(1);
            expect(log.info.getCall(0).args).to.be.equal(['< GET /test?hii=hoo 200']);
            expect(log.error.callCount).to.be.equal(0);
        });

        lab.test('Call /health and verify log', async () => {
            const result = await server.inject({method: 'get', url: '/health'});
            expect(log.info.callCount).to.be.equal(1);
            expect(log.info.getCall(0).args).to.be.equal(['never mind this']);
            expect(log.error.callCount).to.be.equal(0);
        });

        lab.test('Call /undefined and verify log', async () => {
            const result = await server.inject({method: 'get', url: '/undefined'});
            expect(log.info.callCount).to.be.equal(1);
            expect(log.info.getCall(0).args).to.be.equal(['< GET /undefined 200']);
            expect(log.error.callCount).to.be.equal(0);
        });

        lab.test('Call /null and verify log', async () => {
            const result = await server.inject({method: 'get', url: '/null'});
            expect(log.info.callCount).to.be.equal(0);
            expect(log.error.callCount).to.be.equal(0);
        });

        lab.test('Call 404 and verify log', async () => {
            const result = await server.inject({method: 'get', url: '/dupont'});
            expect(log.info.callCount).to.be.equal(0);
            expect(log.error.callCount).to.be.equal(1);
            expect(log.error.getCall(0).args).to.be.equal(['< GET /dupont 404']);
        });

        lab.test('Call 500 and verify log', async () => {
            const result = await server.inject({method: 'get', url: '/err'});
            expect(log.info.callCount).to.be.equal(0);
            expect(log.error.callCount).to.be.equal(1);
            expect(log.error.getCall(0).args).to.be.equal(['< GET /err 500']);
        });
    });
});

//
//  test-hapi-utils.js ends here
