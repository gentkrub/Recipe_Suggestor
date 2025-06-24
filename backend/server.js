// server.js
require("dotenv").config();
const axios = require("axios");
process.env.GOOGLE_APPLICATION_CREDENTIALS = "./speech-key.json";
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const { SpeechClient } = require("@google-cloud/speech");

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

const client = new SpeechClient();

app.get("/", (req, res) => {
  res.send("Backend is working!");
});

const upload = multer({ dest: "uploads/" });

app.post("/speech", upload.single("audio"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const audioBytes = fs.readFileSync(filePath).toString("base64");

    const request = {
      config: {
        encoding: "WEBM_OPUS",
        sampleRateHertz: 48000,
        languageCode: "en-US",
        enableAutomaticPunctuation: true,
      },
      audio: { content: audioBytes },
    };
    console.log("🧪 Sending audio to Google:", {
      length: audioBytes.length,
      config: request.config,
    });
    const [response] = await client.recognize(request);
    const transcription = response.results.map(r => r.alternatives[0].transcript).join("\n");

    fs.unlinkSync(filePath);
    res.json({ transcript: transcription });
  } catch (err) {
    console.error("❌ Error transcribing audio:", err);
    res.status(500).json({ error: "Failed to transcribe" });
  }
});

app.get("/recipes/:ingredient", async (req, res) => {
  const ingredient = req.params.ingredient;
  try {
    const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`);
    if (response.data.meals) {
      res.json(response.data);
    } else {
      res.status(404).json({ error: "No recipes found for this ingredient" });
    }
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ error: "Failed to fetch recipes", details: error.message });
  }
});

app.get("/api/proxy/meals", async (req, res) => {
  const letter = req.query.f || "a";
  const url = `https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`;
  try {
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error("❌ Proxy error fetching meals:", error.message);
    res.status(500).json({ error: "Failed to fetch meals from MealDB" });
  }
});

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("❌ DB connection error:", err);
  } else {
    console.log("✅ Connected to MySQL");
  }
});

app.post("/signup", async (req, res) => {
  const { firstname, lastname, age, gender, height, weight, email, password } = req.body;

  if (!firstname || !lastname || !age || !gender || !height || !weight || !email || !password) {
    return res.status(400).json({ error: "Please fill in all fields." });
  }

  const parsedHeight = parseInt(height, 10);
  if (isNaN(parsedHeight) || parsedHeight < 50 || parsedHeight > 250) {
    return res.status(400).json({ error: "Height must be between 50 and 250 cm." });
  }

  const parsedWeight = parseInt(weight, 10);
  if (isNaN(parsedWeight) || parsedWeight < 30 || parsedWeight > 200) {
    return res.status(400).json({ error: "Weight must be between 30 and 200 kg." });
  }

  const parsedAge = parseInt(age, 10);
  if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
    return res.status(400).json({ error: "Please enter a valid age (1-120)." });
  }

  db.query("SELECT * FROM signup WHERE email = ?", [email], async (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (result.length > 0) {
      return res.status(409).json({ error: "Email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertSql = `INSERT INTO signup (firstname, lastname, age, gender, height, weight, email, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(insertSql, [firstname, lastname, age, gender, height, weight, email, hashedPassword], (err2, result2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      res.json({ id: result2.insertId, firstname, lastname, age, gender, height, weight, email });
    });
  });
});
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Please enter email and password." });

  db.query("SELECT * FROM signup WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(401).json({ error: "Invalid email or password." });

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: "Invalid email or password." });

    const { id, firstname, lastname, age, gender, height, email: userEmail } = user;
    res.json({ id, firstname, lastname, age, gender, height, email: userEmail });
  });
});

app.post("/api/ingredient", (req, res) => {
  const { ingredients, submitted_at, user_id } = req.body;
  if (!ingredients || ingredients.length === 0 || !submitted_at || !user_id) {
    return res.status(400).json({ error: "Missing ingredients, timestamp, or user ID" });
  }

  const submissionSql = "INSERT INTO submissions (submitted_at, user_id) VALUES (?, ?)";
  db.query(submissionSql, [submitted_at, user_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const submissionId = result.insertId;
    const values = ingredients.map((item) => [submissionId, item.name, item.quantity || 1]);
    const ingredientSql = "INSERT INTO ingredients (submission_id, name, quantity) VALUES ?";

    db.query(ingredientSql, [values], (err2, result2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ message: "Submission and ingredients saved", submission_id: submissionId });
    });
  });
});

app.get("/api/ingredients/latest", (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  const latestSubmissionSql = "SELECT submission_id FROM submissions WHERE user_id = ? ORDER BY submission_id DESC LIMIT 1";
  db.query(latestSubmissionSql, [userId], (err, submissionResult) => {
    if (err) return res.status(500).json({ error: err.message });
    if (submissionResult.length === 0) return res.json({ ingredients: [] });

    const latestId = submissionResult[0].submission_id;
    const ingredientSql = "SELECT name, quantity FROM ingredients WHERE submission_id = ?";
    db.query(ingredientSql, [latestId], (err2, ingredientsResult) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ submission_id: latestId, ingredients: ingredientsResult });
    });
  });
});

app.post("/api/favorites", (req, res) => {
  const { user_id, meal_id, meal_name, meal_thumb } = req.body;
  if (!user_id || !meal_id) return res.status(400).json({ error: "Missing user ID or meal ID" });

  const sql = `INSERT INTO favorites (user_id, meal_id, meal_name, meal_thumb) VALUES (?, ?, ?, ?)`;
  db.query(sql, [user_id, meal_id, meal_name, meal_thumb], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Favorite saved" });
  });
});

app.get("/api/favorites/:user_id", (req, res) => {
  const userId = req.params.user_id;
  const sql = `SELECT * FROM favorites WHERE user_id = ?`;
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ favorites: results });
  });
});

app.delete("/api/favorites", (req, res) => {
  const { user_id, meal_id } = req.body;
  if (!user_id || !meal_id) return res.status(400).json({ error: "Missing user ID or meal ID" });

  const sql = `DELETE FROM favorites WHERE user_id = ? AND meal_id = ?`;
  db.query(sql, [user_id, meal_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Favorite removed" });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});