import pool from "./src/utils/db";

async function migrate() {
  try {
    await pool.execute(
      "ALTER TABLE users ADD COLUMN gender ENUM('Male', 'Female') DEFAULT 'Male' AFTER website;",
    );
    console.log("Migration successful: added gender column");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
