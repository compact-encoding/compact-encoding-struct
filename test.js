const c = require('compact-encoding')
const generate = require('./')
const test = require('tape')

test('generate encoding', t => {
  const struct = {
    start: c.uint,
    length: c.uint,
    nodes: c.buffer,
    additionalNodes: c.buffer,
    signature: c.fixed64
  }

  const cstruct = generate(struct)

  const test = {
    start: 12,
    length: 176,
    nodes: Buffer.from('1234567890abcdefghijklmnopqrstuvwxyz'),
    additionalNodes: Buffer.from('efghijklmnopqrstuvwxyz1234567890abcd'),
    signature: Buffer.alloc(64, 1)
  }

  const enc = c.encode(cstruct, test)
  t.same(test, c.decode(cstruct, enc), 'simple')

  const nested = {
    start: c.uint,
    length: c.uint,
    nodes: c.buffer,
    struct: cstruct,
    signature: c.fixed64
  }

  const testNest = {
    start: 12,
    length: 176,
    nodes: Buffer.from('1234567890abcdefghijklmnopqrstuvwxyz'),
    struct: test,
    signature: Buffer.alloc(64, 1)
  }

  const nestenc = c.encode(generate(nested), testNest)
  t.same(testNest, c.decode(generate(nested), nestenc), 'nested')

  t.end()
})
