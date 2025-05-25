# Azure Multimodal Travel Bot

A simple Node.js + Express chatbot that gives travel destination recommendations based on **text** and **image** input.  
Uses Azure OpenAI to extract keywords from user messages, Azure Computer Vision to tag uploaded photos, and Azure Cosmos DB to store/query destination data.

## 🚀 Features

- Natural-language text input via **Azure OpenAI** (GPT-3.5 Turbo)
- Image tag extraction via **Azure Computer Vision** (Tags)
- Multimodal fusion: combines text & image tags for richer suggestions
- **Azure Cosmos DB** backend storing destinations with tags
- Chatbot-style UI running locally at `http://localhost:3000`

## 🎯 Prerequisites

1. [Node.js (v16+)](https://nodejs.org/)
2. Azure subscriptions & resources:
   - **Azure Cosmos DB** (Core SQL)
   - **Azure Computer Vision**
   - **Azure OpenAI Service**

## ⚙️ Installation

```bash
# 1. Clone this repo
git clone https://github.com/your-org/azure-multimodal-travel-bot.git
cd azure-multimodal-travel-bot

# 2. Install dependencies
npm install
```

## 🔐 Configuration

Create a file named `.env` in the project root with your Azure keys/endpoints:

```bash
COSMOS_ENDPOINT=https://<your-cosmos-account>.documents.azure.com:443/
COSMOS_KEY=<your-cosmos-primary-key>

VISION_ENDPOINT=https://<your-vision-region>.api.cognitive.microsoft.com/
VISION_KEY=<your-vision-key>

OPENAI_ENDPOINT=https://<your-openai-resource>.openai.azure.com/
OPENAI_KEY=<your-openai-key>
```

## ▶️ Running Locally

```bash
node server.js
```

Then open your browser at `http://localhost:3000` and try:

- Type a sentence (e.g. “I want a quiet place to hike”)
- Or upload an image
- See detected tags & suggested destinations

## 📂 File Structure

```bash
azure-multimodal-travel-bot/
├── .env                   # Your Azure keys & endpoints
├── server.js              # Main Node.js + Express logic
├── package.json           # Project dependencies and scripts
├── public/
│   └── index.html         # Chatbot UI (text + image)
└── uploads/               # Temporary folder for incoming images
```
