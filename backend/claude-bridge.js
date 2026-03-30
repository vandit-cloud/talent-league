const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const app = express();

app.use(cors());
app.use(express.json());

// Simple bridge to Claude Desktop via CLI
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        const prompt = messages.map(m => m.content).join('\n\n');
        
        // Use Anthropic's API directly with your API key
        // You'll need to get an API key from https://console.anthropic.com/
        res.status(503).json({ 
            error: 'Claude Desktop API not available. Please use one of these options:\n\n' +
                   '1. Get Claude API key from https://console.anthropic.com/ and add to .env\n' +
                   '2. Install Claude via Ollama: ollama pull claude\n' +
                   '3. The system will automatically fall back to OpenAI'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(8080, () => {
    console.log('Claude Bridge running on port 8080');
});
