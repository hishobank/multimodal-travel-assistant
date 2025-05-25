const fs = require('fs');
const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const { CosmosClient } = require('@azure/cosmos');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Cosmos DB setup
const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY
});
const database = client.database('travelDB');
const container = database.container('destinations');

// 🔍 OpenAI (text → keyword)
async function getKeywordFromOpenAI(text) {
  const systemPrompt = `Your job is to extract ONE simple keyword that represents a travel destination type based on the user's message.
Only return one of these words: beach, mountain, temple, nature, hiking, city, culture, history, island, adventure, surfing.
If the user mentions hiking or quiet nature, return "mountain".
If the user mentions spiritual or ancient sites, return "temple".
Do NOT explain. ONLY return the one keyword.`;

  const data = {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: text }
    ],
    max_tokens: 10,
    temperature: 0
  };

  try {
    const response = await axios.post(
      `${process.env.OPENAI_ENDPOINT}openai/deployments/gpt-35-turbo/chat/completions?api-version=2024-12-01-preview`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.OPENAI_KEY
        }
      }
    );

    const keyword = response.data.choices[0].message.content.trim().toLowerCase();
    console.log("🧠 OpenAI keyword:", keyword);
    return keyword;

  } catch (err) {
    console.error("OpenAI error:", err.response?.data || err.message);
    return "";
  }
}

// 📸 Vision API → tags from image
async function getTagsFromImage(imagePath) {
  const imageData = fs.readFileSync(imagePath);

  const response = await axios.post(
    `${process.env.VISION_ENDPOINT}vision/v3.2/analyze?visualFeatures=Tags`,
    imageData,
    {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Ocp-Apim-Subscription-Key': process.env.VISION_KEY
      }
    }
  );

  const tags = response.data.tags.map(tag => tag.name.toLowerCase());
  console.log("🖼️ Vision API tags:", tags);
  return tags;
}

// 🔁 POST /recommend route
app.post('/recommend', upload.single('image'), async (req, res) => {
  const textInput = req.body.text?.trim();
  const fileInput = req.file;
  let finalTags = [];

  // Extract from text
  if (textInput) {
    const keyword = await getKeywordFromOpenAI(textInput);
    if (keyword) {
      finalTags.push(keyword);
    }
  }

  // Extract from image
  if (fileInput) {
    try {
      const tags = await getTagsFromImage(fileInput.path);
      if (tags.length > 0) {
        finalTags.push(tags[0]); // use top tag
      }
    } catch (err) {
      console.error("❌ Image tag detection failed:", err);
    }
  }

  finalTags = [...new Set(finalTags)];
  console.log("🔎 Final combined tags:", finalTags);

  if (finalTags.length === 0) {
    return res.send(`<a href="/">← Back</a><h2>No tags detected. Please enter text or upload an image.</h2>`);
  }

  // Cosmos DB query
  const queryText = `
    SELECT * FROM c 
    WHERE ${finalTags.map((tag, i) => `CONTAINS(LOWER(c.tags), @tag${i})`).join(' OR ')}
  `;
  const parameters = finalTags.map((tag, i) => ({ name: `@tag${i}`, value: tag }));

  let suggestions = [];
  try {
    const querySpec = { query: queryText, parameters };
    const { resources } = await container.items.query(querySpec).fetchAll();
    suggestions = resources;
  } catch (err) {
    console.error("❌ Cosmos DB query failed:", err);
  }

  // Build clean HTML output
  let html = `<a href="/">← Back</a><br><br>`;
  html += `<p><strong>You said:</strong> ${textInput || '[image only]'}</p>`;
  html += `<p><strong>Tags:</strong> ${finalTags.join(', ')}</p>`;
  html += `<p><strong>Suggested Places:</strong></p>`;

  if (suggestions.length === 0) {
    html += `<p>No suggestions found.</p>`;
  } else {
    html += `<ul>`;
    suggestions.forEach(item => {
      html += `<li><strong>${item.name}</strong>: ${item.description}</li>`;
    });
    html += `</ul>`;
  }

  res.send(html);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Travel Bot running at http://localhost:${port}`);
});
