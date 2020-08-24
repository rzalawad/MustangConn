# reloadable [![Build Status](https://secure.travis-ci.org/BetSmartMedia/node-reloadable.png?branch=master)](http://travis-ci.org/BetSmartMedia/node-reloadable)

This is a simple wrapper around a module that allows it to be reloaded on
signals, which is particularly useful when using a module for configuration.

## Synopsis

    // config.js
    module.exports = {
      someService: {
        username: 'stephen'
        password: 'blahblah'
      }
    }

    // app.js
    var config = require('reloadable')(__dirname + '/config', {
      signal: 'SIGHUP',
      // This is the default error handler, override it if you need more.
      exposeReload: true
      error: function(err, path) {
        console.error(path, err)
      }
    })

    var client = require('./service-client')(config)
    config.reload()

## Install

  npm install reloadable

## API

`require('reloadable')` returns a function that takes a module path and an
options object. The path will be passed to `require` unmodified inside the
`reloadable` module, so it should **not** be relative.

The options object can be omitted, or contain any of the following keys:

* **signal** - If given, the configuration reload function will be called
  when the process recieves the given signal.
* **exposeReload* - If true, the reload function will be assigned to `.reload`
  on the returned object. Caution, this will hide any existing property named 'reload'
  your object might have.
* **error** - A function that will be called with `(err, path)` if an
  exception is thrown while reloading the module. The default prints the path
  and error to stderr.

## License

MIT
