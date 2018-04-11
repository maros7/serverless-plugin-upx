# serverless-plugin-upx

A [Serverless Framework](https://github.com/serverless/serverless) plugin for minifying Golang binaries with [UPX](https://upx.github.io/) - the Ultimate Packer for eXecutables. The plugin utilizes a Node.js cross-platform wrapper for UPX found [here](https://github.com/roccomuso/upx).

## Usage

```yaml

service: my-service

plugins:
  - serverless-plugin-upx

custom:
  upx:
    brute: true

```

Please note that valid custom options are 'faster', 'better', 'best', 'brute', 'ultraBrute', 'force' and '8mibRam'.
