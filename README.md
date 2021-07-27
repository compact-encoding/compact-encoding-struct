# compact-encoding-struct

Generate compact encodings from defined structs

## Usage
```js
const c = require('compact-encoding')
const { compile, opt, array, flag } = require('compact-encoding-struct')

const struct = {
  start: c.uint,
  length: opt(c.uint),
  nodes: array(c.buffer),
  block: flag()
}

const cstruct = compile(struct)

const enc = c.encode(cstruct, someMessage)
const sameMessage = c.decode(compile(struct), enc)
```

## API

#### `const cenc = compile(struct)`

`struct` should be an object of field names and their corresponding compact encodings.

To specify and array encoding simply pass `[encoding]` in place of `encoding`
```
{
  lengths: [c.uint],
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

#### `{ array: array(enc) }`

`array` is a helper function to designate array encodings. It operates the same as `[enc]` described above.

#### `{ optional: opt(enc, [defaultValue = null]) }`

`opt` is a helper function to designate optional fields. 

If the field is present it shal be encoded and decoded using compact encoding `enc`.

If the field was not present in the encoded message, the decoded value will be set to `defaultValue`.

#### `{ flag: flag() }`

`flag` is a helper function to define flags. The value in the message should be `true`/`false` and will be encoded/decoded using a bitfield to save bytes.
