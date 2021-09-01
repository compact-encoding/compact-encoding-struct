const c = require('compact-encoding')
const bitfield = require('./bitfield')

module.exports = {
  compile,
  opt,
  array
}

function compile (struct) {
  function preencode (state, msg) {
    if (!state.headers) state.headers = []
    const headerIndex = state.headers.length

    const header = {}
    header.flag = []
    header.opt = []

    for (const [field, cenc] of Object.entries(struct)) {
      const enc = parseArray(cenc)
      const special = enc.preencode(state, msg[field])
      if (!special) continue
      header[special.type].push(special.value)
    }

    bitfield.preencode(state, header.flag)
    bitfield.preencode(state, header.opt)

    state.headers.splice(headerIndex, -1, header)
  }

  function encode (state, msg) {
    const header = state.headers.shift()

    bitfield.encode(state, header.flag)
    bitfield.encode(state, header.opt)

    for (const [field, cenc] of Object.entries(struct)) {
      const enc = parseArray(cenc)
      enc.encode(state, msg[field], header)
    }
  }

  function decode (state) {
    const header = {
      flag: bitfield.decode(state),
      opt: bitfield.decode(state)
    }

    const ret = {}
    for (const [field, cenc] of Object.entries(struct)) {
      const enc = parseArray(cenc)
      ret[field] = enc.decode(state, header)
    }

    return ret
  }

  return {
    preencode,
    encode,
    decode
  }
}

function opt (enc, defaultVal = null) {
  const cenc = parseArray(enc)
  return {
    preencode (state, opt) {
      if (opt) {
        cenc.preencode(state, opt)
      }
      return {
        type: 'opt',
        value: !!opt
      }
    },
    encode (state, opt, header) {
      if (header.opt.shift()) cenc.encode(state, opt)
    },
    decode (state, header) {
      if (!header.opt.shift()) return defaultVal
      return cenc.decode(state)
    }
  }
}

function array (enc) {
  return [enc]
}

module.exports.flag = {
  preencode (state, bool, flags) {
    return {
      type: 'flag',
      value: bool
    }
  },
  encode () {}, // ignore
  decode (state, header) {
    return !!header.flag.shift()
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
