module.exports = reloadable

var inspect = require('util').inspect

function reloadable (module_path, opts) {
	var facade = {
		toJSON: function() { return this.__proto__ },
		inspect: function() { return inspect(this.__proto__) },
	}
	
	opts || (opts = {})
	opts.error || (opts.error = defaultErrorHandler)

	var _reload = opts.reload || function refreshrequire () {
		delete require.cache[require.resolve(module_path)]
		return require(module_path)
	}

	function reload () {
    try { facade.__proto__ = _reload() }
		catch (err) { opts.error(err, module_path) }
	}

	if (opts.signal) process.on(opts.signal, reload)
	if (opts.exposeReload) facade.reload = reload

	reload()
	return facade
}

function defaultErrorHandler (err, path) {
	console.error(path, err)
}
