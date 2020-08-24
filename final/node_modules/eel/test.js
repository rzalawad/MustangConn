var test = require('tap').test('eel tests', function (t) {
	t.plan(2)
	t.test('core tests', require('./core_test'))
	t.test('backend tests', function (t) {
		['file', 'tcp'].forEach(function (name) {
			t.test(name + ' backend', require('./backends/' + name).selfTest)
		})
	})
})


