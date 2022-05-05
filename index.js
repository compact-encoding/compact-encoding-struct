const c = require('compact-encoding')
const bitfield = require('./bitfield')

module.exports = {
  compile,
  opt,
  array,
  constant,
  header,
  getHeader,
  either
}

function compile (struct) {
  function preencode (state, msg) {
    if (!state.headers) state.headers = []
    const headerIndex = state.headers.length

    const header = {}

    header.flag = []
    header.opt = []
    header.flags = Object.values(struct)
      .reduce((acc, v) => acc | v.flags, false)

    header.state = {
      start: 0,
      end: 0,
      buffer: null
    }

    for (const [field, cenc] of Object.entries(struct)) {
      const enc = parseArray(cenc)
      enc.preencode(state, msg[field], header)
    }

    if (header.flags) {
      bitfield.preencode(header.state, header.flag)
      bitfield.preencode(header.state, header.opt)

      // hack cause we don't have buffer at this point
      c.uint.preencode(state, header.state.end)
      state.end += header.state.end
    }

    state.headers.splice(headerIndex, -1, header)
  }

  function encode (state, msg) {
    const header = state.headers.shift()

    const headerOffset = state.start
    if (header.flags) {
      header.state.buffer = Buffer.alloc(header.state.end)

      c.buffer.encode(state, header.state.buffer)

      bitfield.encode(header.state, header.flag)
      bitfield.encode(header.state, header.opt)
    }

    for (const [field, cenc] of Object.entries(struct)) {
      const enc = parseArray(cenc)
      enc.encode(state, msg[field], header)
    }

    const finalOffset = state.start

    if (header.flags) {
      state.start = headerOffset
      c.buffer.encode(state, header.state.buffer)
    }

    state.start = finalOffset
  }

  function decode (state) {
    const flags = Object.values(struct)
      .reduce((acc, v) => acc | v.flags, false)

    let flag = []
    let opt = []
    let header

    if (flags) {
      const buffer = c.buffer.decode(state)
      header = {
        start: 0,
        end: buffer.byteLength,
        buffer
      }

      flag = bitfield.decode(header)
      opt = bitfield.decode(header)
    }

    const ret = {}
    for (const [field, cenc] of Object.entries(struct)) {
      const enc = parseArray(cenc)
      ret[field] = enc.decode(state, { flag, opt, state: header })
    }

    return ret
  }

  return {
    preencode,
    encode,
    decode
  }
}

function getHeader (buf, struct) {
  const buffer = c.decode(c.buffer, buf)
  const state = {
    start: 0,
    end: buffer.byteLength,
    buffer
  }

  const flag = bitfield.decode(state)
  const opt = bitfield.decode(state)

  const ret = {}
  for (const [field, cenc] of Object.entries(struct)) {
    const enc = parseArray(cenc)
    ret[field] = enc.decode(state, { flag, opt, state })
  }

  return ret
}

function opt (enc, defaultVal = null) {
  const cenc = parseArray(enc)
  return {
    flags: true,
    preencode (state, opt, header) {
      if (opt) cenc.preencode(header.state, opt)
      header.opt.push(!!opt)
    },
    encode (state, opt, header) {
      if (header.opt.shift()) cenc.encode(header.state, opt)
    },
    decode (state, header) {
      if (!header.opt.shift()) return defaultVal
      return cenc.decode(header.state)
    }
  }
}

function constant (enc, value) {
  return {
    preencode (state) {
      enc.preencode(state, value)
    },
    encode (state) {
      enc.encode(state, value)
    },
    decode (state) {
      const prop = enc.decode(state)
      if (!same(prop, value)) {
        throw new Error(`Expect constant value: ${value}, got ${prop}`)
      }
      return value
    }
  }
}

// this encodes the field in the header
function header (enc) {
  return {
    flags: true,
    preencode (state, value, header) {
      enc.preencode(header.state, value)
    },
    encode (state, value, header) {
      enc.encode(header.state, value)
    },
    decode (state, header) {
      return enc.decode(header.state)
    }
  }
}

function array (enc) {
  return [enc]
}

module.exports.flag = {
  flags: true,
  preencode (state, bool, header) {
    header.flag.push(bool)
  },
  encode () {}, // ignore
  decode (state, header) {
    return !!header.flag.shift()
  }
}

function either (encodings, test) {
  return {
    preencode (state, value) {
      const index = test(value)
      c.uint.preencode(state, index)
      encodings[index].preencode(state, value)
    },
    encode (state, value) {
      const index = test(value)
      c.uint.encode(state, index)
      encodings[index].encode(state, value)
    },
    decode (state) {
      const index = c.uint.decode(state)
      return encodings[index].decode(state)
    }
  }
}

function parseArray (enc) {
  let nest = 0
  while (Array.isArray(enc)) {
    enc = enc[0]
    nest++
  }
  for (let i = 0; i < nest; i++) enc = c.array(enc)
  return enc
}

// only for numbers, strings and buffers
function same (a, b) {
  if (typeof a !== typeof b) return false
  if (typeof a === 'number' || typeof a === 'string') return a === b
  if (a instanceof Uint8Array) {
    if (!(b instanceof Uint8Array)) return false
    return Buffer.compare(a, b) === 0
  }
  return false
}
