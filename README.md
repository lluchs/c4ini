C4INI
=====

Parses ini files as used by Clonk masterservers. In contrast to
standard ini files, these can have nested sections.
See test/files for some example files.

c4ini will take an ini file string and convert it to a
JavaScript object.

Usage
-----

```javascript
var fs = require('fs')
var c4ini = require('c4ini')

var iniString = fs.readFileSync('file.ini')
// There are no options.
var result = c4ini(iniString)
```
