const c = require('compact-encoding')
const { compile, opt, array, flag } = require('./')
const test = require('tape')

test('compile encoding', t => {
  const struct = {
    start: c.uint,
    length: c.uint,
    nodes: c.buffer,
    additionalNodes: c.buffer,
    signature: c.fixed64
  }

  const cstruct = compile(struct)

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

  const nestenc = c.encode(compile(nested), testNest)
  t.same(testNest, c.decode(compile(nested), nestenc), 'nested')

  t.end()
})

test('array encoding', t => {
  const struct = {
    length: [c.uint]
  }

  const cstruct = compile(struct)

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

  const nestenc = c.encode(compile(nested), testNest)
  t.same(testNest, c.decode(compile(nested), nestenc), 'nested')

  t.end()
})

test('flag encoding', t => {
  const struct = {
    1: flag,
    2: flag,
    3: flag,
    4: flag,
    5: flag
  }

  const cstruct = compile(struct)

  const test = {
    1: true,
    2: false,
    3: true,
    4: false,
    5: false
  }

  const enc = c.encode(cstruct, test)
  t.same(enc.byteLength, 3, 'correct length')
  t.same(c.decode(cstruct, enc), test, 'simple')

  const nested = {
    nest: [cstruct]
  }

  const test2 = {
    1: false,
    2: false,
    3: true,
    4: true,
    5: false
  }
  const testNest = {
    nest: [test, test2]
  }

  const nestenc = c.encode(compile(nested), testNest)
  t.same(c.decode(compile(nested), nestenc), testNest, 'nested')

  t.end()
})

test('optional encoding', t => {
  const struct = {
    length: opt(c.uint),
    width: c.uint,
    memo: c.string
  }

  const cstruct = compile(struct)

  const test = {
    width: 32,
    memo: 'test without optional'
  }

  const enc = c.encode(cstruct, test)

  const exp = {
    length: null,
    ...test
  }
  t.same(c.decode(cstruct, enc), exp, 'without optional')

  const testWith = {
    length: 32,
    width: 32,
    memo: 'test with optional'
  }

  const encWith = c.encode(cstruct, testWith)
  t.same(c.decode(cstruct, encWith), testWith, 'with optional')

  const nested = {
    length: opt(array(c.uint)),
    nest: opt(cstruct)
  }

  const testNest = {
    nest: testWith
  }

  const nestenc = c.encode(compile(nested), testNest)

  const testExp = {
    length: null,
    ...testNest
  }
  t.same(c.decode(compile(nested), nestenc), testExp, 'nested')

  const testNestWith = {
    length: [32, 362, 217, 8329],
    nest: test
  }

  const nestencWith = c.encode(compile(nested), testNestWith)

  const testNestExp = {
    length: [32, 362, 217, 8329],
    nest: exp
  }
  t.same(testNestExp, c.decode(compile(nested), nestencWith), 'nested')

  t.end()
})
