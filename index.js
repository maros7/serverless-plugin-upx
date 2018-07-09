'use strict';

const semver = require('semver');
const upx = require('upx');

const os = process.platform

class UPX {
  constructor(serverless, options) {
    if (!semver.satisfies(serverless.version, '>= 1.26')) {
      throw new Error('serverless-plugin-upx requires serverless 1.26 or higher!');
    }
    
    this.serverless = serverless;
    this.options = options;
    this.upxOpts = Object.assign({}, 
      this.serverless.service.custom && this.serverless.service.custom.upx ? this.serverless.service.custom.upx : {}, 
      this.options ? this.options : {}
    );
    this.upx = upx(this.upxOpts);

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
        this.upx(handler).start().then((stats) => {
          this.serverless.cli.log(`Executed UPX on ${handler}: ${stats.fileSize.before} bytes -> ${stats.fileSize.after} bytes`);
        }).catch((err) => {
        if (!/.*AlreadyPackedException.*/.exec(err) || 
              (os === 'darwin' && !/.*make sure to install upx native dependency with: brew install upx.*/.exec(err))) {
            throw new Error(`Could not execute UPX on ${handler}: ${err}`);
          }
        });
      }
    });
  }
}

module.exports = UPX;
