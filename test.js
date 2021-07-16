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

test('array encoding', t => {
  const struct = {
    length: [c.uint]
  }

  const cstruct = generate(struct)

  const test = {
    length: [176, 23, 14, 37, 3485792]
  }

  const enc = c.encode(cstruct, test)
  t.same(test, c.decode(cstruct, enc), 'simple')

  const nested = {
    nest: [cstruct]
  }

  const testNest = {
    nest: [test, { length: [123, 456, 789] }]
  }

  const nestenc = c.encode(generate(nested), testNest)
  t.same(testNest, c.decode(generate(nested), nestenc), 'nested')

  t.end()
})

test('optional encoding', t => {
  const struct = {
    _length: c.uint,
    width: c.uint,
    memo: c.string
  }

  const cstruct = generate(struct)

  const test = {
    width: 32,
    memo: 'test without optional'
  }

  const enc = c.encode(cstruct, test)
  t.same(test, c.decode(cstruct, enc), 'without optional')

  const testWith = {
    length: 32,
    width: 32,
    memo: 'test with optional'
  }

  const encWith = c.encode(cstruct, testWith)
  t.same(testWith, c.decode(cstruct, encWith), 'with optional')

  const nested = {
    _length: [c.uint],
    _nest: cstruct
  }

  const testNest = {
    nest: testWith
  }

  const nestenc = c.encode(generate(nested), testNest)
  t.same(testNest, c.decode(generate(nested), nestenc), 'nested')

  const testNestWith = {
    length: [32, 362, 217, 8329],
    nest: test
  }

  const nestencWith = c.encode(generate(nested), testNestWith)
  t.same(testNestWith, c.decode(generate(nested), nestencWith), 'nested')

  t.end()
})
