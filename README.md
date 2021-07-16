# compact-encoding-struct

Generate compact encodings from defined structs

## Usage
```js
const c = require('compact-encoding')
const generate = require('compact-encoding-struct')

const struct = {
  start: c.uint,
  length: c.uint,
  nodes: c.buffer,
  additionalNodes: c.buffer,
  signature: c.fixed64
}

const cstruct = generate(struct)

const enc = c.encode(cstruct, someMessage)
const sameMessage = c.decode(generate(struct), enc)
```

## API

#### `const cenc = generate(struct)`

`struct` should be an object of field names and their corresponding compact encodings.


Returns compact encodings for `struct`:
```
{
  encode,
  preencode,
  decode
}
```
