module.exports = toBytes;

/**
 * Parse a size given in kilo/mega/gigabytes into a number of bytes
 */
function toBytes (size, canThrow) {
	var m = size.trim().toLowerCase().match(/^(\d+)\s*(?:(k|m|g)b?)?$/);

	if (!m) {
		if (canThrow) throw new Error("Invalid size: " + size)
		else return
	}

	var n = Number(m[1])
		, unit = m[2] || 'none'
		, mult = multipliers[unit];

	if (!mult) {
		if (canThrow) throw new Error("Invalid size: " + size)
		else return
	}

	return n * mult;
}

var multipliers = {
	none: 1,
	k: 1024,
	m: 1024 * 1024,
	g: 1024 * 1024 * 1024,
	t: 1024 * 1024 * 1024 * 1024
}

if (require.main === module) {
	var tests = [
		{input: '1024', output: 1024},
		{input: '2mb',  output: 2 * 1024 * 1024},
		{input: '3m',   output: 3 * 1024 * 1024},
		{input: 'toast',   output: undefined},
		{input: 'toast',   shouldThrow: true},
	];

	var pass = true
	var ok = function (i) {
		var test = tests[i]
			, result = 'ok ' + i + ' - ' + test.input + (
					test.shouldThrow ? ' throws' : ' == ' + test.output
				)
		console.log(result)
	}
	var notOk = function (i, message) {
		var test = tests[i]
		var result = 'not ok - ' + i + ' ' + test.input + ' == ' + test.output
		if (message) result += ': ' + message
		console.log(result)
		pass = false
	}
	for (var i in tests) {
		var test = tests[i]
		try {
			var got = toBytes(test.input, test.shouldThrow);
			if (got == test.output) ok(i)
			else notOk(i, got)
		} catch (err) {
			if (test.shouldThrow) ok(i)
			else notOk(i, err)
		}
	}
	process.exit(Number(!pass))
}
