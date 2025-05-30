require('dotenv').config();
const axios = require('axios');
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors()); // Allows frontend to call backend
app.use(express.json()); // Allows sending JSON data

// Google Cloud Speech client
const speech = require("@google-cloud/speech");
const client = new speech.SpeechClient();

// Simple GET route to verify the server is running
app.get("/", (req, res) => {
    res.send("Backend is working!");
});

// POST route for speech-to-text
app.post("/speech-to-text", async (req, res) => {
    const { audio } = req.body;  // Expecting base64-encoded audio
    if (!audio) {
        return res.status(400).json({ error: "No audio provided" });
    }

    // Ensure the audio is valid base64
    if (!isBase64(audio)) {
        return res.status(400).json({ error: "Invalid base64 audio format" });
    }

    console.log('Base64 Audio received:', audio);  // Debugging step: log the base64 string

    // Call the recognizeSpeech function to process the audio
    try {
        const transcription = await recognizeSpeech(audio);
        return res.json({ text: transcription });
    } catch (error) {
        console.error("Speech recognition failed:", error);  // Log the error in detail
        return res.status(500).json({ error: "Speech recognition failed", details: error.message });
    }
});

// Function to recognize speech
const recognizeSpeech = async (base64Audio) => {
    const request = {
        config: {
            encoding: "FLAC",  // Ensure this matches the audio format
            languageCode: "en-US",
            enableAutomaticPunctuation: true,
        },
        audio: {
            content: base64Audio,  // Audio content
        },
    };

    try {
        const [response] = await client.recognize(request);
        const transcription = response.results
            .map((result) => result.alternatives[0].transcript)
            .join("\n");

        return transcription || "No speech detected.";
    } catch (error) {
        console.error("Speech-to-Text Error:", error);
        throw error;  // Re-throw the error to be caught in the POST route
    }
};

// Helper function to validate base64 string
const isBase64 = (str) => {
    try {
        return Buffer.from(str, 'base64').toString('base64') === str;
    } catch (err) {
        return false;
    }
};

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

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

//PALM DATABASE
const mysql = require('mysql2');

const exp = express();
exp.use(cors());          
exp.use(express.json()); 

// 4. CONNECT TO DATABASE
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'jitsopinz47',
  database: 'recipeapp'
});

db.connect((err) => {
  if (err) {
    console.error('❌ DB connection error:', err);
    return;
  }
  console.log('✅ Connected to MySQL');
});

//INSERT INGREDIENT ROUTE
app.post('/api/ingredient', (req, res) => {
    const { ingredients, submitted_at } = req.body;
  
    console.log('🔵 Received data:', req.body);
  
    if (!ingredients || ingredients.length === 0 || !submitted_at) {
      return res.status(400).json({ error: 'Missing ingredients or timestamp' });
    }
  
    //Insert submission
    const submissionSql = 'INSERT INTO submissions (submitted_at) VALUES (?)';
    db.query(submissionSql, [submitted_at], (err, result) => {
      if (err) {
        console.error('❌ Submission insert error:', err.message);
        return res.status(500).json({ error: err.message });
      }
  
      const submissionId = result.insertId;
      console.log('🟢 Created submission with ID:', submissionId);
  
      //Prepare ingredient data with that submission_id
      const values = ingredients.map(item => [submissionId, item.name, item.quantity]);
      const ingredientSql = 'INSERT INTO ingredients (submission_id, name, quantity) VALUES ?';
  
      db.query(ingredientSql, [values], (err2, result2) => {
        if (err2) {
          console.error('❌ Ingredient insert error:', err2.message);
          return res.status(500).json({ error: err2.message });
        }
  
        console.log('✅ Ingredients inserted:', result2);
        res.json({ message: 'Submission and ingredients saved', submission_id: submissionId });
      });
    });
  });

  //GET FOR FETCH THE LASTEST SUBMISSION
  app.get('/api/ingredients/latest', (req, res) => {
    //Get the latest submission_id
    const latestSubmissionSql = 'SELECT submission_id FROM submissions ORDER BY submission_id DESC LIMIT 1';
  
    db.query(latestSubmissionSql, (err, submissionResult) => {
      if (err) {
        console.error('❌ Error fetching latest submission:', err.message);
        return res.status(500).json({ error: err.message });
      }
  
      if (submissionResult.length === 0) {
        return res.json({ ingredients: [] }); // No data yet
      }
  
      const latestId = submissionResult[0].submission_id;
  
      //Get ingredients for that submission
      const ingredientSql = 'SELECT name, quantity FROM ingredients WHERE submission_id = ?';
      db.query(ingredientSql, [latestId], (err2, ingredientsResult) => {
        if (err2) {
          console.error('❌ Error fetching ingredients:', err2.message);
          return res.status(500).json({ error: err2.message });
        }
  
        res.json({ submission_id: latestId, ingredients: ingredientsResult });
      });
    });
  });
  
  

//START SERVER
app.listen(3000, () => {
  console.log('🚀 Server running on port 3000');
});
