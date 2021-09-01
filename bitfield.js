const c = require('compact-encoding')

module.exports = {
  preencode (state, bits = []) {
    const n = Math.ceil(bits.length / 8)
    const len = (n <= 0xfc ? 1 : n <= 0xffff ? 3 : n <= 0xffffffff ? 5 : 9) + n
    state.end += len
  },
  encode (state, bits = []) {
    const bitfield = Buffer.alloc(Math.ceil(bits.length / 8))
    for (let i = 0; i < bits.length; i++) {
      const index = i >>> 3
      bitfield[index] |= bits[i] << i % 8
    }
    c.buffer.encode(state, bitfield)
  },
  decode (state) {
    const bits = []
    const buf = c.buffer.decode(state)
    if (!buf) return bits

    const bitLen = buf.byteLength << 3
    for (let i = 0; i < bitLen; i++) {
      const index = i >>> 3
      bits[i] = (buf[index] & (1 << i % 8)) !== 0
    }
    return bits
  }
}
