require("dotenv").config();
const axios = require("axios");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const { SpeechClient } = require("@google-cloud/speech");

const app = express();
app.use(cors());
app.use(express.json());

// 🔊 Google Cloud Speech-to-Text
const client = new SpeechClient();

app.get("/", (req, res) => {
  res.send("Backend is working!");
});

// 🎤 Speech-to-text endpoint
app.post("/speech-to-text", async (req, res) => {
  const { audio } = req.body;
  if (!audio || !isBase64(audio)) {
    return res.status(400).json({ error: "Invalid or missing audio" });
  }

  try {
    const transcription = await recognizeSpeech(audio);
    return res.json({ text: transcription });
  } catch (error) {
    console.error("Speech recognition failed:", error);
    return res
      .status(500)
      .json({ error: "Speech recognition failed", details: error.message });
  }
});

// 🌐 MealDB API forwarding route (ingredient-based)
app.get("/recipes/:ingredient", async (req, res) => {
  const ingredient = req.params.ingredient;
  try {
    const response = await axios.get(
      `https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`
    );
    if (response.data.meals) {
      res.json(response.data);
    } else {
      res.status(404).json({ error: "No recipes found for this ingredient" });
    }
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch recipes", details: error.message });
  }
});

// 🍽️ Proxy route to get meals by first letter (bypasses local network issues)
app.get("/api/proxy/meals", async (req, res) => {
  const letter = req.query.f || "a"; // default to 'a' if none given
  const url = `https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`;

  try {
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error("❌ Proxy error fetching meals:", error.message);
    res.status(500).json({ error: "Failed to fetch meals from MealDB" });
  }
});

// ✅ MySQL Database Setup via ngrok or local
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

// 💾 Save Ingredients
app.post("/api/ingredient", (req, res) => {
  const { ingredients, submitted_at } = req.body;

  if (!ingredients || ingredients.length === 0 || !submitted_at) {
    return res.status(400).json({ error: "Missing ingredients or timestamp" });
  }

  const submissionSql = "INSERT INTO submissions (submitted_at) VALUES (?)";
  db.query(submissionSql, [submitted_at], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const submissionId = result.insertId;
    const values = ingredients.map((item) => [
      submissionId,
      item.name,
      item.quantity,
    ]);
    const ingredientSql =
      "INSERT INTO ingredients (submission_id, name, quantity) VALUES ?";

    db.query(ingredientSql, [values], (err2, result2) => {
      if (err2) return res.status(500).json({ error: err2.message });

      res.json({
        message: "Submission and ingredients saved",
        submission_id: submissionId,
      });
    });
  });
});

// 📦 Load Latest Ingredients
app.get("/api/ingredients/latest", (req, res) => {
  const latestSubmissionSql =
    "SELECT submission_id FROM submissions ORDER BY submission_id DESC LIMIT 1";

  db.query(latestSubmissionSql, (err, submissionResult) => {
    if (err) return res.status(500).json({ error: err.message });
    if (submissionResult.length === 0) return res.json({ ingredients: [] });

    const latestId = submissionResult[0].submission_id;
    const ingredientSql =
      "SELECT name, quantity FROM ingredients WHERE submission_id = ?";

    db.query(ingredientSql, [latestId], (err2, ingredientsResult) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ submission_id: latestId, ingredients: ingredientsResult });
    });
  });
});

// 🎧 Helper: Speech recognition
async function recognizeSpeech(base64Audio) {
  const request = {
    config: {
      encoding: "FLAC",
      languageCode: "en-US",
      enableAutomaticPunctuation: true,
    },
    audio: { content: base64Audio },
  };

  const [response] = await client.recognize(request);
  const transcription = response.results
    .map((result) => result.alternatives[0].transcript)
    .join("\n");

  return transcription || "No speech detected.";
}

// 🧪 Helper: Validate base64
function isBase64(str) {
  try {
    return Buffer.from(str, "base64").toString("base64") === str;
  } catch {
    return false;
  }
}

// 🚀 Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
