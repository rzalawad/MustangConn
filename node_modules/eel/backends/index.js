var url = require('url')

exports.register  = register
exports.configure = configure
exports.unload    = unload

var factories = {}
	, handlers = {}
	, log // Lazy-loaded

register('file:', require('./file'))
register('tcp:', require('./tcp'))

function register (protocol, factory) {
	factories[protocol] = factory
}

function configure (uri, levels) {
	var handler = loadBackend(uri)
	log || (log = require('../'))
	levels.forEach(function (level) {
		log.on(level, handler)
	})
	return handler
}

function loadBackend (uri) {
	if (uri in handlers) return handlers[uri];

	var parsed = url.parse(uri, true)
		, factory = factories[parsed.protocol];

	if (!factory) {
		throw new Error("Unsupported protocol " + protocol + ", perhaps you forgot to register it?")
	}

	return handlers[uri] = factory(parsed)
}

function unload (uri) {
	var handler = handlers[uri]
	if (!handler) return
	log || (log = require('../'))
	Object.keys(log._events).forEach(function (lvl) {
		log.removeListener(lvl, handler)
	})
	handler.end && handler.end()
}
