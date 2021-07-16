const c = require('compact-encoding')

module.exports = function (struct) {
  function preencode (state, msg) {
    for (const [field, cenc] of Object.entries(struct)) {
      if (Array.isArray(cenc)) {
        c.array(cenc[0]).preencode(state, msg[field])
      } else {
        cenc.preencode(state, msg[field])
      }
    }
  }

  function encode (state, msg) {
    for (const [field, cenc] of Object.entries(struct)) {
      if (Array.isArray(cenc)) {
        c.array(cenc[0]).encode(state, msg[field])
      } else {
        cenc.encode(state, msg[field])
      }
    }
  }

  function decode (state, msg) {
    const ret = {}
    for (const [field, cenc] of Object.entries(struct)) {
      if (Array.isArray(cenc)) {
        ret[field] = c.array(cenc[0]).decode(state)
      } else {
        ret[field] = cenc.decode(state)
      }
    }
    return ret
  }

  return {
    preencode,
    encode,
    decode
  }
}
