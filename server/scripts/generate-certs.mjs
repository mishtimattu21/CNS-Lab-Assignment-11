/**
 * Generates self-signed localhost TLS files without OpenSSL (Windows-friendly).
 * Run: npm run generate-certs --prefix server
 */
import selfsigned from 'selfsigned';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certsDir = path.join(__dirname, '../certs');
const keyPath = path.join(certsDir, 'server.key');
const certPath = path.join(certsDir, 'server.crt');

fs.mkdirSync(certsDir, { recursive: true });

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('TLS files already exist:', certsDir);
  process.exit(0);
}

const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365, keySize: 2048, algorithm: 'sha256' });

fs.writeFileSync(keyPath, pems.private, 'utf8');
fs.writeFileSync(certPath, `${pems.cert}\n`, 'utf8');

console.log('Created TLS files for local WSS:');
console.log(' ', keyPath);
console.log(' ', certPath);
