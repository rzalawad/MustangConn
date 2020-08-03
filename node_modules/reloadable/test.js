fs = require('fs')
assert = require('assert')

configPath = __dirname + '/settings.js'
fs.renameSync(__dirname+"/settings1.js", configPath)

config = require('./')(configPath, {signal: 'SIGHUP'})

assert.equal(config.key1, "original")

// will be run after the config is reloaded
process.on('SIGHUP', function(){
	assert.equal(config.key1, "changed")
	fs.renameSync(configPath, __dirname+"/settings2.js")
})

fs.renameSync(configPath, __dirname+"/settings1.js")
fs.renameSync(__dirname+"/settings2.js", configPath)
process.kill(process.pid, 'SIGHUP')
