export function sha256(message: string): string {
  const utf8 = unescape(encodeURIComponent(message));
  const blocks: number[] = [];
  const len = utf8.length;
  for (let i = 0; i < len; i++) {
    blocks.push(utf8.charCodeAt(i));
  }
  blocks.push(0x80);
  while (blocks.length % 64 !== 56) {
    blocks.push(0);
  }
  const bitLen = len * 8;
  for (let i = 0; i < 8; i++) {
    blocks.push((bitLen >>> (56 - i * 8)) & 0xff);
  }

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  const sigma0 = (x: number) => rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22);
  const sigma1 = (x: number) => rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25);
  const gamma0 = (x: number) => rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
  const gamma1 = (x: number) => rotr(x, 17) ^ rotr(x, 19) ^ (x >>> 10);

  for (let offset = 0; offset < blocks.length; offset += 64) {
    const W = new Array(64);
    for (let t = 0; t < 16; t++) {
      const i = offset + t * 4;
      W[t] = (blocks[i] << 24) | (blocks[i + 1] << 16) | (blocks[i + 2] << 8) | blocks[i + 3];
    }
    for (let t = 16; t < 64; t++) {
      W[t] = (gamma1(W[t - 2]) + W[t - 7] + gamma0(W[t - 15]) + W[t - 1]) >>> 0;
    }

    let a = H[0], b = H[1], c = H[2], d = H[3];
    let e = H[4], f = H[5], g = H[6], h = H[7];

    for (let t = 0; t < 64; t++) {
      const T1 = (h + sigma1(e) + (((e) & (f)) ^ (~(e) & (g))) + K[t] + W[t]) >>> 0;
      const T2 = (sigma0(a) + (((a) & (b)) ^ ((a) & (c)) ^ ((b) & (c)))) >>> 0;
      h = g; g = f; f = e; e = (d + T1) >>> 0;
      d = c; c = b; b = a; a = (T1 + T2) >>> 0;
    }

    H = H.map((v, i) => (v + [a, b, c, d, e, f, g, h][i]) >>> 0);
  }

  return H.map(n => n.toString(16).padStart(8, '0')).join('');
}

export function hashPassword(password: string): string {
  const salt = Math.random().toString(36).substring(2, 10);
  const hash = sha256(password + salt);
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  return sha256(password + salt) === hash;
}
