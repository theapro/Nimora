/*
  Usage:
    node scripts/bcrypt-hash.js admin123
    node scripts/bcrypt-hash.js "myStrongPassword" 10

  Prints a bcrypt hash you can paste into database.sql for admin_users.password
*/

const bcrypt = require("bcrypt");

async function main() {
  const password = process.argv[2];
  const rounds = Number(process.argv[3] ?? 10);

  if (!password) {
    console.error(
      "Missing password. Example: node scripts/bcrypt-hash.js admin123",
    );
    process.exit(1);
  }

  if (!Number.isFinite(rounds) || rounds < 8 || rounds > 14) {
    console.error(
      "Invalid rounds. Use a number between 8 and 14 (default 10).",
    );
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, rounds);

  console.log("\nBCRYPT HASH:");
  console.log(hash);
  console.log("\nSQL EXAMPLE:");
  console.log(
    "UPDATE admin_users SET password = '" +
      hash.replace(/'/g, "''") +
      "' WHERE email = 'admin@nimora.uz';",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
