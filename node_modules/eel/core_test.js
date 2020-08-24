var log = require('./')

module.exports = function (t) {
	t.plan(3)

	t.test('defaults', function (t) {
		t.plan(2)
		log.once('entry', function(entry) {
			t.equal('info', entry['@fields'].level, 'default level is info')
			t.ok(entry['@timestamp'], 'entry has a timestamp')
		})

		log('blah')
	})

	t.test('errors', function (t) {
		t.plan(1)
		console_error = console.error
		console.error = function (entry) {
			t.equal('error', entry['@fields'].level, "errors without listeners are handled")
		}
		log.error('Something bad')
		console.error = console_error
	})

	t.test('mutable entries', function (t) {
		t.plan(1)
		log.once('entry', function (entry) {
			entry['@fields'].modified = true
		})
		log.once('entry', function (entry) {
			t.ok(entry['@fields'].modified, 'entries can be modified by listeners')
		})
		log('mutate me')
	})
}

if (require.main === module) require('tap').test('core tests', module.exports)
