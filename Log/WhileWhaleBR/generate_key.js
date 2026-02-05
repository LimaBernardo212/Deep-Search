import crypto from 'crypto';

const key = crypto.randomBytes(32).toString('hex');
console.log('🔑 ENCRIPTION_KEY gerada:');
console.log(key);
console.log('\n📋 Tamanho:', key.length, '(deve ser 64)');
console.log('\n🔧 Adicione no .env:');
console.log(`ENCRIPTION_KEY=${key}`);