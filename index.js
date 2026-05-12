import express from "express";
import fs from "fs";
import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// -------- DB CONFIG --------
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

// -------- COUNTRIES --------
const countries = [
  "india",
  "united-states",
  "united-kingdom"
];

// -------- GET SUBCATEGORY IDS --------
async function getSubcategoryIds(pool) {
  const result = await pool.request()
    .query("SELECT id FROM subcategory_master");

  return result.recordset.map(row => String(row.id));
}

// -------- MAIN --------
async function generateLinks() {
  try {
    console.log("🔌 Connecting to DB...");

    const pool = await sql.connect(dbConfig);

    const subcategories = await getSubcategoryIds(pool);

    console.log("✅ Subcategories loaded:", subcategories.length);

    let html = `
    <html>
    <head>
      <title>Eventbrite Links</title>
    </head>
    <body>
      <h2>Generated Eventbrite Links</h2>
    `;

    for (let subId of subcategories) {

      html += `<h3>Subcategory: ${subId}</h3>`;

      for (let country of countries) {

        const url = `https://www.eventbrite.com/d/${country}/all-events/?subcategories=${subId}`;

        html += `<a href="${url}" target="_blank">${url}</a><br>`;
      }
    }

    html += "</body></html>";

    fs.writeFileSync("links.html", html);

    console.log("✅ links.html generated successfully");

    await pool.close();

  } catch (err) {

    console.error("❌ Error:", err.message);
  }
}

generateLinks();

// -------- SERVER --------
app.get("/", (req, res) => {
  res.send("Server running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});