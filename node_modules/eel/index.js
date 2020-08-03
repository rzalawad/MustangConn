var safeJSON = require('./formatter').safeJSON

function log (type, data) {
	log.info(type, data)
}

log.backends   = require('./backends')
log.formatter  = require('./formatter')
module.exports = log

var EventEmitter = require('events').EventEmitter
	, emitter = new EventEmitter
	;

['debug', 'info', 'warning', 'error', 'critical'].forEach(function(level){
	log[level] = function(type, data) {
		log.write(level, type, data)
	}
})

log.write = function (level, message, field_data) {
	if (typeof message == 'object') {
		if (field_data) message = safeJSON(message)
		else {
			data = message
			message = '<no message>'
		}
	}

	var entry = {
		'@message': message,
		'@fields': {level: level},
		'@tags': [],
		'@timestamp': new Date().toISOString()
	}

	if (field_data) {
		for (var k in field_data) {
			if (k[0] == '@') entry[k] = field_data[k]
			else entry['@fields'][k] = field_data[k]
		}
	}

	log.emit('entry', entry)
	// Don't crash process when errors are logged without listeners
	if (level === 'error' && log.listeners('error').length == 0) console.error(entry)
  else log.emit(level, entry)
}

log.first = function (event, handler) {
	emitter.listeners(event).unshift(handler)
}

// Expose all EventEmitter methods directly
;[
	'on',
	'addListener',
	'once',
	'removeListener',
	'removeAllListeners',
	'setMaxListeners',
	'listeners',
	'emit'
].forEach(function (method) {
	log[method] = emitter[method].bind(log)
})
