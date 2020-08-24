# eel - EventEmitter Logging [![Build Status](https://secure.travis-ci.org/BetSmartMedia/node-eel.png?branch=master)](http://travis-ci.org/BetSmartMedia/node-eel)

eel is a logging "framework" that hopes to embody a few simple principles:

1. Logging should be easy.
2. Logs should record structured data.
3. Logging should be flexible.

It accomplishes these goals by decoupling the logging of events from the writing
of logs in the simplest way possible: using an
[EventEmitter][EventEmitter]


## Easy

The `eel` module exports a function that logs at the "info" level:

    log = require('eel')
    version = require('./package.json').version
    log("Started up", {version: version, port: port})

To log at another level, use the `log[level]` functions:

    process.on('uncaughtException', function (err) {
      log.error("uncaughtException", {err: err})
      process.exit(1)
    })

The default levels are debug, info, warning, error, and critical.


## Structured Data

Eel uses the [logstash JSON event format][ls_format] internally. Every logging
method takes a `@message` as the first parameter, and an object representing
the `@fields` part of a event as the second. Either parameter can be omitted,
and if you include any of the `@` prefixed "metadata" fields in the field data
object they will override the defaults.

Confused? Hopefully these examples will clarify:

    log('Something happened', {count: 10})
    /*
    { '@message': 'Something happened',
      '@tags': [],
      '@fields': { level: 'info', count: 10 },
      '@timestamp': '2012-12-16T05:44:48.125Z' }
    */

    log.warn('Something happened', {count: 10, '@tags': ['bad']})
    /*
    { '@message': 'Something happened',
      '@tags': ['bad'],
      '@fields': { level: 'warn', count: 10 },
      '@timestamp': '2012-12-16T05:44:48.125Z' }
    */

    log.error('Something happened', {'@message': 'Overridden!'})
    /*
    { '@message': 'Overridden!',
      '@tags': [],
      '@fields': { level: 'error' },
      '@timestamp': '2012-12-16T05:44:48.125Z' }
    */

Be careful, Eel doesn't go out of it's way to prevent you from generating
garbage log entries!


## Flexible

In addition to the various logging methods, the `eel` object also acts like an
[EventEmitter][EventEmitter]. In fact, none of the above examples produce any
output, because nothing is listening to the events being emitted. To rectify
this we can attach the simplest possible logging backend to the 'entry' event:

    log.on('info', console.log).on('error', console.error)

Now our prepared log entry objects will be printed to the console:

    log('Something happened', {relephant: 'data'})
    /* Actually prints this to the console:
    { '@message': 'Something happened',
      '@fields': { level: 'info', relephant: 'data' },
      '@timestamp': '2012-05-31T23:49:01.523Z' }
    */

## Logging backends


To configure a backend use `log.backends.configure` with a URI describing the
backend and it's options. Logging to a file:

    log.backends.configure('file:///var/log/my_program.log?rotateSize=')

* [File backend](https://github.com/BetSmartMedia/node-eel/blob/master/backends/file.md)
* [TCP backend](https://github.com/BetSmartMedia/node-eel/blob/master/backends/tcp.md)

you write your own let me know or send me a pull request to add it to the list:

* [eel-stream](http://github.com/BetSmartMedia/node-eel-stream) - Write logs to a
  stream (file, tcp socket, whatever) using a formatter function.
* [eel-amqp](http://github.com/BetSmartMedia/node-eel-amqp) - Send logs to an AMQP
  server.

## TODO

Investigate using EventEmitter2 for namespacing and pattern matching log events.

[EventEmitter]: (http://nodejs.org/api/events.html#events_class_events_eventemitter)
[ls_format]: (https://github.com/logstash/logstash/wiki/logstash%27s-internal-message-format)
