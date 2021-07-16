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

To specify and array encoding simply pass `[encoding]` in place of `encoding`, to specify optional fields prefix with `_` eg.
```
{
  length: [c.uint],
  _width: c.uint
}
```

Returns compact encodings for `struct`:
```
{
  encode,
  preencode,
  decode
}
```
