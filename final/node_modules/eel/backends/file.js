var fs            = require('fs')
var reloadable    = require('reloadable')
var toBytes       = require('to-bytes')
var streamHandler = require('./stream')
var log

module.exports = function fileFactory (uri) {
  var makeStream;
  if (!(uri.query.reloadSignal || uri.query.rotateSize)) {
		makeStream = createWriteStream.bind(null, uri)
  } else {
		makeStream = reloadableWriteStream.bind(null, uri)
  }
  return streamHandler(makeStream)
}

function createWriteStream(uri) {
  return fs.createWriteStream(uri.pathname, {
    encoding: uri.query.encoding,
    flags: uri.query.flags || 'a',
    mode: Number(uri.query.mode || 0666)
  })
}

function reloadableWriteStream (uri) {
	log = log || require('../')

  var facade = {}
  facade.__proto__ = createWriteStream(uri)

  facade.rotate = function () {
    var stream = facade.__proto__
    var maxFiles = parseInt(uri.query.maxFiles) - 1
    stream.end()
    stream.destroySoon()
    // Still need 1 sync rename :|
    fs.renameSync(uri.pathname, uri.pathname + '.tmp')
    facade.__proto__ = createWriteStream(uri)
    stream.once('close', function () {
			if (!maxFiles) log.warn("No maxFiles option in URI", {uri: uri});
      rotateNames(uri.pathname, maxFiles, function (err) {
        if (err) return facade.emit('error', err)
      })
    })
  }


  if (uri.query.rotateSize) {
    var rotateSize = toBytes(uri.query.rotateSize, true)
    facade.write = function () {
      if (this.__proto__.bytesWritten > rotateSize) this.rotate()
      this.__proto__.write.apply(this.__proto__, arguments)
    }
  } else {
    facade.write = function () {
      this.__proto__.write.apply(this.__proto__, arguments)
    }
  }

  if (uri.query.rotateSignal) {
    process.on(uri.query.rotateSignal, facade.rotate)
  }

  return facade
}

function rotateNames (base, maxN, done) {
  var n = 0
  fs.exists(base + '.' + n, search)

  function search (exists) {
    if (!exists) return renameNext()
    if (maxN && n == maxN) return fs.unlink(base + '.' + n, renameNext)
    n++
    fs.exists(base + '.' + n, search)
  }

  function renameNext (err) {
    if (err) return done(err)
    var dest = base + '.' + n
      , next = n == 0 ? done : renameNext
      , src = base + (n == 0 ? '.tmp' : '.' + (--n))
      ;
    fs.rename(src, dest, next)
  }
}

/**
 * Self-test. Log enough messages to roll over the log more than `maxFiles` times.
 */
module.exports.selfTest = function (t) {
	t.plan(5)
  var log = require('../')
  var filename = (process.env.TMP_DIR || '/tmp') + '/whatevs.log'
  var maxFiles = 3
  var expectedSuffixes = ['', '.0', '.1', '.2']

  // Clean up previous test run
  expectedSuffixes.forEach(function (suffix) {
    if (fs.existsSync(filename + suffix))
      fs.unlinkSync(filename + suffix)
  })

  var testUri = 'file://' + filename + '?rotateSize=1k&maxFiles=' + maxFiles
  log.backends.configure(testUri, ['info']);
  var i = 0
  function writenext () {
    if (++i > 45) {
      // This block runs multiple times to check that `unload` can be called
      // repeatedly. 
      log.backends.unload(testUri)
			if (i > 100) return checkState()
      log("shouldn't crash", {end: true})
    } else {
      log('testing', {i: i})
    }
    setTimeout(writenext, 10)
  }
  writenext()

	function checkState () {
    // Check that all the files were created
    expectedSuffixes.forEach(function (suffix) {
      t.ok(fs.existsSync(filename + suffix), filename  + suffix + ' exists')
		})
		t.ok(!fs.existsSync(filename + '.3'), "no extra file created")
  }
}

if (require.main === module) {
	require('tap').test('file backend', module.exports.selfTest)
}
