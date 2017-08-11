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
const hapier = require('../index');

lab.experiment('Hapi utils', function() {
    lab.test('Promised Hapi (bluebird promise)', function(done) {
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

    lab.test('Promised Hapi (native promise)', function(done) {
        const prhapi = new hapier.PromisedHapi(new hapi.Server());
        expect(prhapi.instance).to.be.instanceof(hapi.Server);
        prhapi.instance.connection({port: 16666});
        const pr = prhapi.start();
        expect(pr).to.be.instanceof(Promise);
        pr.then(() => prhapi.stop()).then(done);
    });
});

//
//  test-hapi-utils.js ends here
