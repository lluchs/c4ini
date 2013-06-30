// c4ini parser

const INDENTSIZE = 2

const sectionRegex = /^\s*\[([\w ]+)\]/
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

// Decodes the given value (string).
var decodeValue = function(value) {
  if (value.charAt(0) == '"' && value.charAt(value.length - 1) == '"') {
    // Quoted string.
    // Remove quotes.
    value = value.slice(1, -1)
    // Unescape quotes.
    value = value.replace(/\\"/g, '"')
    // Octal escape sequences.
    value = value.replace(/\\(\d+)/g, function(str, n) {
      return String.fromCharCode(parseInt(n, 8))
    })
    // Escaped backslashes.
    value = value.replace(/\\\\/g, "\\")
    return value
  }
  else if (/^\d+$/.test(value.trim()))
    return parseInt(value, 10)
  else if (value == 'true')
    return true
  else if (value == 'false')
    return false
  else
    return value
}

module.exports = function(ini) {
  var obj = {}, current = null
  var stack = [obj]

  var parseLine = function(line, lineNumber) {
    var level = indentLevel(line)
    var match
    if (match = sectionRegex.exec(line)) {
      // This is a section header, create a new object.
      var key = match[1]
      // Check indentation.
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
      current = {}
      // Check whether there is already a section with the same name.
      if (stack[level][key]) {
        // We might have to create an array.
        if (Array.isArray(stack[level][key])) {
          // There is already one.
          stack[level][key].push(current)
        }
        else {
          // Put the object there into a new array.
          var tmp = stack[level][key]
          stack[level][key] = [tmp, current]
        }
      }
      else {
        // We're first.
        stack[level][key] = current
      }
    }
    else if (match = entryRegex.exec(line)) {
      // Check indentation.
      if (level < stack.length - 1) {
        // Reduce stack size, moving the current item.
        stack.length = level + 2
        current = stack[level + 1]
      }
      else if (level >= stack.length) {
        throw new Error('Key/value item has wrong indentation in line ' + (lineNumber + 1))
      }
      var key = match[1], value = match[2]
      current[key] = decodeValue(value)
    }
    else {
      throw new Error('Parse error in line ' + (lineNumber + 1))
    }
  }

  ini.split("\n").forEach(skipEmpty(parseLine))
  return obj
}
