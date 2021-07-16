const c = require('compact-encoding')
const Bitfield = require('bitfield').default

module.exports = function (struct) {
  const optionals = Object.keys(struct).filter(isOptional)

  function preencode (state, msg) {
    const bitfield = optionals.length ? new Bitfield(optionals.length) : null
    if (optionals.length) {
      c.buffer.preencode(state, bitfield.buffer)
    }

    let count = 0
    for (let [field, cenc] of Object.entries(struct)) {
      if (isOptional(field)) {
        field = field.substring(1)
        if (!msg[field]) {
          bitfield.set(count++, false)
          continue
        } else {
          bitfield.set(count++)
        }
      }

      let nest = 0
      while (Array.isArray(cenc)) {
        cenc = cenc[0]
        nest++
      }
      for (let i = 0; i < nest; i++) cenc = c.array(cenc)
      cenc.preencode(state, msg[field])
    }
  }

  function encode (state, msg) {
    const startIndex = state.start

    const bitfield = optionals.length ? new Bitfield(optionals.length) : null
    if (optionals.length) c.buffer.encode(state, bitfield.buffer)

    let count = 0
    for (let [field, cenc] of Object.entries(struct)) {
      if (isOptional(field)) {
        field = field.substring(1)
        if (!msg[field]) {
          bitfield.set(count++, false)
          continue
        } else {
          bitfield.set(count++)
        }
      }

      let nest = 0
      while (Array.isArray(cenc)) {
        cenc = cenc[0]
        nest++
      }
      for (let i = 0; i < nest; i++) cenc = c.array(cenc)
      cenc.encode(state, msg[field])
    }

    if (optionals.length) {
      state.start = startIndex
      c.buffer.encode(state, Buffer.from(bitfield.buffer))
    }
  }

  function decode (state) {
    let bitfield
    let count = 0

    const options = optionals.length ? c.buffer.decode(state) : null
    if (options) {
      bitfield = new Bitfield()
      bitfield.buffer = options
    }

    const ret = {}
    for (let [field, cenc] of Object.entries(struct)) {
      if (isOptional(field)) {
        if (!bitfield.get(count++)) continue
        field = field.substring(1)
      }

      let nest = 0
      while (Array.isArray(cenc)) {
        cenc = cenc[0]
        nest++
      }
      for (let i = 0; i < nest; i++) cenc = c.array(cenc)
      ret[field] = cenc.decode(state)
    }
    return ret
  }

  return {
    preencode,
    encode,
    decode
  }
}

function isOptional (key) {
  return key[0] === '_'
}
