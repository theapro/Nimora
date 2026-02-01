const bcrypt = require('bcrypt');

const password = 'admin123';
const saltRounds = 10;

async function hashPassword() {
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Password hash:', hash);
}

hashPassword();
