var vows = require('vows'),
    assert = require('assert')

var fs = require('fs')

var c4ini = require('../c4ini')

var read = function(filename) {
  return function () {
    fs.readFile(__dirname + '/files/' + filename + '.ini', 'utf8', this.callback)
  }
}

var parse = function(file) { return c4ini(file) }

var includes = function(section, keys) {
  return function(obj) {
    keys.forEach(function(key) {
      assert.includes(obj[section], key)
    })
  }
}

vows.describe('c4ini').addBatch({
  'when indenting more than once': {
    topic: read('invalid_indentation'),

    'we get an exception': function(err, topic) {
      assert.throws(function() { c4ini(topic) }, Error)
    }
  },
  'when having keys outside a section': {
    topic: read('no_section'),

    'we get an exception': function(err, topic) {
      assert.throws(function() { c4ini(topic) }, Error)
    }
  }
}).addBatch({
  'with only one section,': {
    topic: read('simple'),

    'parsing': {
      topic: parse,

      'returns an object with the section': function(obj) {
	assert.include(obj, 'section')
      },
      'the object': {
	topic: function(obj) { return obj.section },

	'includes key1': function(section) {
	  assert.include(section, 'key1')
	  assert.equal(section.key1, 'value1')
	},
	'includes key2': function(section) {
	  assert.include(section, 'key2')
	  assert.equal(section.key2, 'value2')
	}
      }
    }
  },
  'with three flat sections,': {
    topic: read('multiple_sections'),

    'parsing': {
      topic: parse,

      'includes three sections': function(obj) {
	assert.include(obj, 'section1')
	assert.include(obj, 'section2')
	assert.include(obj, 'section3')
      },

      section1: includes('section1', ['key1', 'key2']),
      section2: includes('section2', ['key3', 'key4']),
      section3: includes('section3', ['key5', 'key6']),
    }
  },
  'with nested sections,': {
    topic: read('nested_sections'),

    'parsing': {
      topic: parse,

      'includes three top-level sections': function(obj) {
	assert.include(obj, 'section1')
	assert.include(obj, 'section2')
	assert.include(obj, 'section3')
      },
      section1: {
	topic: function(obj) { return obj.section1 },

	'has a key-value pair': function(section) {
	  assert.equal(section.key, 'value')
	},
	'has a subsection': function(section) {
	  assert.include(section, 'section1_1')
	},
	'section1_1': includes('section1_1', ['key'])
      },
      section2: {
	topic: function(obj) { return obj.section2 },

	'has a key-value pair': function(section) {
	  assert.equal(section.key, 'value')
	},
	'has two subsections': function(section) {
	  assert.include(section, 'section2_1')
	  assert.include(section, 'section2_2')
	},
	'section2_1': {
	  topic: function(section) { return section['section2_1'] },

	  'has another subsection': function(section) {
	    assert.include(section, 'section2_1_1')
	  }
	},
	'section2_2': includes('section2_2', ['key']),
      },
      section3: includes('section3', ['key']),
    }
  },
  'with identically named sections,': {
    topic: read('array_sections'),

    'parsing': {
      topic: parse,
      
      'creates a main section': includes('main', ['key1', 'key2']),
      'creates an array with the remaining sections': function(obj) {
	assert.includes(obj, 'array')
	assert.equal(obj.array.length, 3)
      },
      'correctly populates the array sections': {
	topic: function(obj) { return obj.array },

	'0': includes(0, ['key3', 'key4']),
	'1': includes(1, ['key5', 'key6']),
	'2': includes(2, ['key7', 'key8']),
      }
    }
  }
}).export(module)
