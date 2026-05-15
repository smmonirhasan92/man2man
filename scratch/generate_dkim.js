const crypto = require('crypto');
const fs = require('fs');

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

fs.writeFileSync('dkim-private.pem', privateKey);

const pubKeyBase64 = publicKey
  .replace('-----BEGIN PUBLIC KEY-----\n', '')
  .replace('\n-----END PUBLIC KEY-----\n', '')
  .replace(/\n/g, '');

const txtRecord = `v=DKIM1; k=rsa; p=${pubKeyBase64}`;
fs.writeFileSync('dkim-dns.txt', txtRecord);
console.log('Keys generated!');
