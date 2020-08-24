# to-bytes

Parse numbers suffixed with `/^(\d+)\s*(?:(k|m|g)b?)$/i` into a number of bytes.

## Synopsis

    var toBytes = require('to-bytes')
		parseSize('100') == 100
		parseSize('10m') == parseSize('10MB') == 10 * 1024 * 1024

## Install

`npm install to-bytes`

## License

MIT
