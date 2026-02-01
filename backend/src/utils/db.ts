import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: parseInt(process.env.DB_PORT || "3306"),
  ssl: {
    rejectUnauthorized: false // <--- Mana shu qatorni qo'shing
  }
});

export default pool;
