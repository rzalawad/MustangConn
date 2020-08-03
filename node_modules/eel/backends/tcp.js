var net = require('net')
var streamHandler = require('./stream')

module.exports = function socketFactory (url) {
	return streamHandler(net.connect.bind(net, url.port, url.hostname))
}

module.exports.selfTest = function (t) {

	function bufferingServer (onEnd) {
		return net.createServer().on('connection', function (socket) {
			var offset = 0
			var buffer =  new Buffer(8912)
			socket.setEncoding('utf-8')
			socket.on('data', function (chunk) {
				offset += buffer.write(chunk, offset)
			}).on('end', function () {
				onEnd.call(this, buffer.slice(0, offset - 1))
			})
		})
	}

	var log = require('../')

	t.plan(2)

	t.test('happy path', function (t) {
		t.plan(12)
		var expected = []
			, received
			;

		var server = bufferingServer(function (buffer) {
			received = buffer.toString().split('\n')
			server.close()
		})

		server.on('close', function () {
			while (received.length && expected.length) {
				var line = received.shift()
				var entry = JSON.parse(line)
				t.deepEqual(expected.shift(), entry)
			}
			t.equal(0, expected.length, expected.length + " still expected")
			t.equal(0, received.length, received.length + " extra lines received")
		})

		server.listen(1234, function () {
			log.on('entry', expected.push.bind(expected))
			log.backends.configure('tcp://localhost:1234', ['entry'])
			for (var i = 0; i < 10; i++) {
				log("Testing 1 2 3", {i: i})
			}
			log.backends.unload('tcp://localhost:1234')
		})
	})

	t.test('reconnect on error', function (t) {
		t.plan(3)

		var received = []
		var reloaded = false

		var server = bufferingServer(function (buffer) {
			received.push(buffer.toString().split('\n').map(JSON.parse))
			debugger
			if (reloaded) server.close()
		})

		log.once('error', function (entry) {
			t.ok(entry, "Logged an error")
			t.equal(entry['@message'], 'Stream emitted error Error: test error',
				'Error message includes stream error')
		})

		server.listen(1235, function () {
			var handler = log.backends.configure('tcp://localhost:1235', ['entry'])

			log("Testing before")


			handler._stream.once('drain', function () {
				handler._stream.emit('error', new Error('test error'))
			})

			handler._stream.once('close', function () {
				reloaded = true
				log("testing after")
				log.backends.unload('tcp://localhost:1235')
			})

		})

		server.on('close', function () {
			t.deepEqual(
				[['info'], ['error', 'info']],
				received.map(function (entries) {
					return entries.map(function (e) { return e['@fields'].level })
				}),
				'All entries received by server'
			)
		})
	})
}

if (require.main === module) {
	require('tap').test('file backend', module.exports.selfTest)
}
