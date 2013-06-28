// c4ini parser

const INDENTSIZE = 2

const sectionRegex = /^\s*\[(\w+)\]/
const entryRegex = /^\s*(\w+)=(.+)/

// Returns the line's indentation level.
var indentLevel = function(line) {
  var level = 0, i = 0
  while (line.charAt(i++) == ' ')
	if (i % INDENTSIZE == 0)
	  level++
  return level
}

// Calls f for non-empty lines.
var skipEmpty = function(f) {
  return function(line) {
	if (!/^\s*$/.test(line))
	  f.apply(this, arguments)
  }
}

module.exports = function(ini) {
  var obj = {}, current = null
  var stack = [obj]

  var parseLine = function(line, lineNumber) {
	var match
	if (match = sectionRegex.exec(line)) {
	  // This is a section header, create a new object.
	  var key = match[1]
	  // Check indentation.
	  var level = indentLevel(line)
	  if (level == stack.length) {
		// One level deeper: Put the enclosing object on the stack.
		stack.push(current)
	  }
	  else if (level < stack.length - 1) {
		// Higher up - remove objects from the stack.
		stack.length = level + 1
	  }
	  else if (level > stack.length) {
		throw new Error('Invalid indentation in line ' + (lineNumber + 1))
	  }
	  // Create the new object.
	  // TODO: Array support
	  current = {}
	  stack[level][key] = current
	}
	else if (match = entryRegex.exec(line)) {
	  var key = match[1], value = match[2]
	  current[key] = value
	}
	else {
	  throw new Error('Parse error in line ' + (lineNumber + 1))
	}
  }

  ini.split("\n").forEach(skipEmpty(parseLine))
  return obj
}
