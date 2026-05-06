import express from 'express';
import cors from 'cors';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

const LOG_FILE = path.join(__dirname, 'Log.txt');

app.use(cors());
app.use(express.json());

function writeLog(message, type = 'INFO') {
    const timestamp = new Date().toLocaleString('el-GR');
    const logEntry = `[${timestamp}] [${type}] ${message}\n`;
    console.log(logEntry.trim());
    try {
        fs.appendFileSync(LOG_FILE, logEntry);
    } catch (err) {
        console.error('Failed to write to log file:', err);
    }
}

// Ensure log file exists
if (!fs.existsSync(LOG_FILE)) {
    writeLog('Server Log Initialized', 'SYSTEM');
}

app.post('/api/log', (req, res) => {
    const { message, type } = req.body;
    writeLog(message, type || 'INFO');
    res.json({ success: true });
});

app.post('/api/etoro-proxy', async (req, res) => {
    const { endpoint, method, targetHeaders, payload } = req.body;
    const targetUrl = `https://public-api.etoro.com${endpoint}`;

    writeLog(`Proxy Request: ${method} ${endpoint} (Target: ${targetUrl})`, 'REQUEST');
    
    try {
        const response = await axios({
            url: targetUrl,
            method: method,
            headers: targetHeaders,
            data: payload
        });
        writeLog(`✅ Success 200: ${endpoint}`, 'SUCCESS');
        res.json(response.data);
    } catch (error) {
        const status = error.response?.status || 'Conn';
        const errorData = JSON.stringify(error.response?.data || error.message);
        writeLog(`❌ Error ${status}: ${endpoint} - ${errorData}`, 'ERROR');
        
        if (status === 401) {
            writeLog("💡 Συμβουλή 401: Το eToro απέρριψε τα κλειδιά.", 'ADVICE');
        } else if (status === 404) {
            writeLog("💡 Συμβουλή 404: Το Endpoint δεν βρέθηκε.", 'ADVICE');
        }
        res.status(status === 'Conn' ? 500 : status).json(error.response?.data || {error: error.message});
    }
});

// ─── Gemini AI Proxy ─────────────────────────────────────────────────────────
// Routes all AI requests through the server to avoid browser CORS/firewall issues
app.post('/api/gemini', async (req, res) => {
    const { model, apiKey, body: geminiBody } = req.body;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    writeLog(`Gemini Request: model=${model}`, 'AI');
    try {
        const response = await axios.post(url, geminiBody, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000
        });
        writeLog(`✅ Gemini Success`, 'AI');
        res.json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const errMsg = JSON.stringify(error.response?.data || error.message);
        writeLog(`❌ Gemini Error ${status}: ${errMsg}`, 'ERROR');
        res.status(status).json(error.response?.data || { error: error.message });
    }
});

app.listen(PORT, () => writeLog(`🚀 Proxy Server ready at http://localhost:${PORT}`, 'SYSTEM'));