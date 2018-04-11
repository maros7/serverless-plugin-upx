'use strict';

const semver = require('semver');
const upx = require('upx');

class UPX {
  constructor(serverless, options) {
    if (!semver.satisfies(serverless.version, '>= 1.26')) {
      throw new Error('serverless-plugin-upx requires serverless 1.26 or higher!');
    }
    
    this.serverless = serverless;
    this.options = options;
    this.upx = upx(this.options)

    this.commands = {
      upx: {
        usage: 'Minifying Golang binaries with UPX (Ultimate Packer for eXecutables)',
        lifecycleEvents: [
          'execute',
        ],
        options: {
          faster: {
            usage: 'Compress faster',
            required: false,
            shortcut: '1',
          },
          force: {
            usage: 'Force compression of suspicious files',
            required: false,
            shortcut: 'f',
          },
          better: {
            usage: 'Compress better',
            required: false,
            shortcut: '9',
          },
          best: {
            usage: 'Compress best (can be slow for big files)',
            required: false,
          },
          brute: {
            usage: 'Try all available compression methods & filters (slow)',
            required: false,
          },
          ultraBrute: {
            usage: 'Try even more compression variants (very slow)',
            required: false,
          },
          '8mibRam': {
            usage: '8 megabyte memory limit (default 2MiB)',
            required: false,
          },
        },
      },
    };

    this.hooks = {
      'before:package:createDeploymentArtifacts': this.executeUpx.bind(this),
      'upx:execute': this.executeUpx.bind(this),
    };
  }

  executeUpx() {
    let isGolangDefaultRuntime = this.serverless.service.provider.runtime === 'go1.x';
    
    Object.keys(this.serverless.service.functions).forEach((key) => {
      let handler = this.serverless.service.functions[key].handler;
      let runtime = this.serverless.service.functions[key].runtime;

      if (handler && ((runtime === 'go1.x') || (!runtime && isGolangDefaultRuntime))) {
        this.upx(handler).output(`${handler}.upx`).start().then((stats) => {
          this.serverless.cli.log(JSON.stringify(stats));
        }).catch((err) => {
          if (!/.*AlreadyPackedException.*/.exec(err)) {
            throw new Error(`Could not execute UPX on ${handler}: ${err}`);
          }
        });
      }
    });
  }
}

module.exports = UPX;