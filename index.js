module.exports = function (struct) {
  function preencode (state, msg) {
    for (const [field, cenc] of Object.entries(struct)) {
      cenc.preencode(state, msg[field])
    }
  }

  function encode (state, msg) {
    for (const [field, cenc] of Object.entries(struct)) {
      cenc.encode(state, msg[field])
    }
  }

  function decode (state, msg) {
    const ret = {}
    for (const [field, cenc] of Object.entries(struct)) {
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
