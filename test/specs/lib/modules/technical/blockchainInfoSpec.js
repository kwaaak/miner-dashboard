'use strict';

var _ = require('lodash'),
    chai = require('chai'),
    expect = chai.expect,
    SandboxedModule = require('sandboxed-module'),

    responses,
    statsAnswer = {
        some: 'stats',
        difficulty: 100 * (1 / 4295032833)
    },
    btcPerBlockAnswer = 2500000000,
    BlockchainInfo = SandboxedModule.require('../../../../../lib/modules/technical/blockchainInfo', {
        requires: {
            'request': function (options, callback) {
                var response = responses[options.uri],
                    triggerResponse = function (err, response) {
                        setTimeout(function () {
                            callback(err, response);
                        }, 20);
                    };

                expect(options.json).to.be.true;
                if (response) {
                    triggerResponse(null, response);
                } else {
                    triggerResponse(new Error('Test Error'));
                }
            }
        }
    });

describe('modules/technical/blockchainInfo', function () {

    beforeEach(function () {
        responses = {
            'http://blockchain.info/stats?format=json': {
                statusCode: 200,
                body: statsAnswer
            },
            'http://blockchain.info/q/bcperblock': {
                statusCode: 200,
                body: btcPerBlockAnswer
            }
        };
    });

    it('should get data from blockchainInfo correctly', function (done) {
        var app = {},
            blockchainInfo = new BlockchainInfo(app);

        blockchainInfo.on('update:data', function (data) {
            expect(data).to.deep.equal(_.extend({}, statsAnswer, {
                btcPerBlock: 25,
                probability: 0.01
            }));
            done();
        });
    });

    [
        'http://blockchain.info/stats?format=json',
        'http://blockchain.info/q/bcperblock'
    ].forEach(function (url) {
        it('should not throw an error if the request to ' + url + 'fails with an error', function (done) {
            var blockchainInfo;

            responses[url] = null;

            blockchainInfo = new BlockchainInfo({});

            setTimeout(function () {
                expect(blockchainInfo.data).not.to.be.ok;
                done();
            }, 50);
        });

        it('should not throw an error if the request to ' + url + 'returns a non 200 http status code and no data', function (done) {
            var blockchainInfo;

            responses['http://blockchain.info/stats?format=json'] = {
                statusCode: 500,
                body: 'Internal Server Error'
            };

            blockchainInfo = new BlockchainInfo({});

            setTimeout(function () {
                expect(blockchainInfo.data).not.to.be.ok;
                done();
            }, 50);
        });

    });

    it('should have the title set correctly', function () {
        var app = {},
            blockchainInfo = new BlockchainInfo(app);

        expect(blockchainInfo.title).to.equal('Blockchain.info');
    });

});