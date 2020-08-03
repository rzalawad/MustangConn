var safeJSON = require('../formatter').safeJSON
var log  // Lazy-loaded

module.exports = function (makeStream) {
	log = log || require('../')

	function handler (entry) {
		var output = safeJSON(entry)
		if (!output) return
		// stream should *always* be writable (see streamError below)
		handler._stream && handler._stream.write(output)
	}

	var lastError = null

	function streamError (err) {
		var stream = handler._stream
			, msg = "Stream emitted error " + err
			, fields = {
					stream: stream,
					err: err,
					stack: err.stack.split('\n').map(function (s) { return s.trim() }),
				}
			;
		stream.end()
		if (!lastError || (new Date() - lastError) > 1000) {
			handler._stream = makeStream().once('error', streamError)
		} else {
			handler._stream = false
			stream.emit('error', err)
		}
		lastError = new Date
		log.error(msg, fields)
	}

	handler._stream = makeStream().once('error', streamError)
	handler.end = function () { handler._stream.writable && handler._stream.end() }

	return handler
}
