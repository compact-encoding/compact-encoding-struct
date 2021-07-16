const c = require('compact-encoding')

module.exports = function (struct) {
  function preencode (state, msg) {
    for (let [field, cenc] of Object.entries(struct)) {
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
    for (let [field, cenc] of Object.entries(struct)) {
      let nest = 0
      while (Array.isArray(cenc)) {
        cenc = cenc[0]
        nest++
      }
      for (let i = 0; i < nest; i++) cenc = c.array(cenc)
      cenc.encode(state, msg[field])
    }
  }

  function decode (state) {
    const ret = {}
    for (let [field, cenc] of Object.entries(struct)) {
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
