const c = require('compact-encoding')
const bitfield = require('./bitfield')

module.exports = {
  compile,
  opt,
  array
}

function compile (struct) {
  function preencode (state, msg) {
    for (const [field, cenc] of Object.entries(struct)) {
      const enc = parseArray(cenc)
      enc.preencode(state, msg[field])
    }

    // need to update outer state if nested struct has flags
    if (!state.flagLen) state.flagLen = 0
    const flagDiff = bitfield.preencode(state, state.flags, state.flagLen)
    state.flagLen += flagDiff

    // same for optionals
    if (!state.optsLen) state.optsLen = 0
    const optsDiff = bitfield.preencode(state, state.opts, state.optsLen)
    state.optsLen += optsDiff

    state.end += flagDiff + optsDiff
  }

  function encode (state, msg) {
    // only need to decode bitfields once
    if (state.flagLen >= 0) {
      bitfield.encode(state, state.flags)
      state.flagLen = -1 // use as flag
    }

    if (state.optsLen >= 0) {
      bitfield.encode(state, state.opts)
      state.optsLen = -1
    }

    for (const [field, cenc] of Object.entries(struct)) {
      const enc = parseArray(cenc)
      enc.encode(state, msg[field])
    }
  }

  function decode (state) {
    // one bitfield for the entire struct
    if (!state.flags) state.flags = bitfield.decode(state)
    if (!state.opts) state.opts = bitfield.decode(state)

    const ret = {}
    for (const [field, cenc] of Object.entries(struct)) {
      const enc = parseArray(cenc)
      ret[field] = enc.decode(state)
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
      if (!state.opts) state.opts = []
      state.opts.push(!!opt)
      if (opt) {
        cenc.preencode(state, opt)
      }
    },
    encode (state, opt) {
      if (state.opts.shift()) cenc.encode(state, opt)
    },
    decode (state) {
      if (!state.opts.shift()) return defaultVal
      return cenc.decode(state)
    }
  }
}

function array (enc) {
  return [enc]
}

module.exports.flag = {
  preencode (state, bool) {
    if (!state.flags) state.flags = []
    state.flags.push(bool)
  },
  encode () {}, // ignore
  decode (state) {
    return state.flags.shift()
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
