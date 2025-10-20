// =========================
// 📦 A.B Deliveries - Node Server
// =========================

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import XLSX from 'xlsx'; // ⚙️ יציב יותר מ־xlsx/xlsx.mjs
import fs from 'fs';
import path from 'path';

// -------------------------
// 🌍 Environment Setup
// -------------------------
console.log('🚀 Starting Node server...');
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;
const PYTHON_API = 'http://localhost:8000'; // FastAPI שלך
const LOG_FILE = path.join(process.cwd(), 'server-node', 'conversations.xlsx');

// -------------------------
// 🧾 Save Conversation to Excel
// -------------------------
function logConversation(name, phone, message, reply) {
  try {
    // נוודא שהתיקייה קיימת
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {recursive: true});
    }

    let data = [];

    // אם הקובץ קיים – נקרא את התוכן
    if (fs.existsSync(LOG_FILE)) {
      try {
        const workbook = XLSX.readFile(LOG_FILE);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        if (sheet) {
          data = XLSX.utils.sheet_to_json(sheet);
        }
      } catch (err) {
        console.warn('⚠️ Failed to read existing Excel file:', err.message);
      }
    }

    // נוסיף את השיחה החדשה
    data.push({
      name: name || 'לא צוין',
      phone: phone || 'לא צוין',
      message,
      reply,
      time: new Date().toLocaleString('he-IL'),
    });

    // ניצור Workbook חדש
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Conversations');

    // נכתוב לקובץ
    try {
      XLSX.writeFile(wb, LOG_FILE);
      console.log(`✅ Conversation logged successfully at: ${LOG_FILE}`);
    } catch (err) {
      const tempFile = LOG_FILE.replace('.xlsx', `_temp_${Date.now()}.xlsx`);
      console.warn('⚠️ Excel locked, saving temp file instead:', tempFile);
      XLSX.writeFile(wb, tempFile);
    }
  } catch (err) {
    console.error('❌ Excel logging error:', err.message);
  }
}

// -------------------------
// 🤖 Ask ChatGPT
// -------------------------
async function askAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OpenAI API key!');

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              "אתה נציג שירות של חברת המשלוחים 'A.B Deliveries'. דבר בעברית בלבד, בנימוס ובמקצועיות.",
          },
          {role: 'user', content: prompt},
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('ChatGPT API error:', error.response?.data || error.message);
    return 'נראה שהמערכת עמוסה כרגע. נציג יחזור אליך בהקדם 💬';
  }
}

// -------------------------
// 🧩 /chat route
// -------------------------
app.post('/chat', async (req, res) => {
  const {name, phone, message} = req.body;
  console.log(`📩 New chat request from ${name || 'לא ידוע'} (${phone || 'לא צוין'})`);

  try {
    let userInfo = 'לא נמצא לקוח תואם במסד הנתונים.';

    // ננסה לבדוק את המשתמש ב־Python API
    try {
      const userResponse = await axios.get(`${PYTHON_API}/api/user`, {
        params: {phone},
        timeout: 3000,
      });

      if (userResponse.data?.exists) {
        userInfo = `הלקוח ${userResponse.data.name} קיים במערכת מאז ${userResponse.data.created_at}.`;
      }
    } catch (err) {
      console.warn('⚠️ Python API unreachable:', err.message);
    }

    // נבנה את ההנחיה לשיחה
    const prompt = `
לקוח בשם ${name || 'לא ידוע'} שולח הודעה: "${message}".
${userInfo}
ענה לו בצורה נעימה, בעברית, בהתבסס על המידע הזה.
    `;

    const reply = await askAI(prompt);
    logConversation(name, phone, message, reply);
    res.json({ok: true, reply});
  } catch (error) {
    console.error('❌ Chat service failed:', error.message);
    res.status(500).json({ok: false, error: 'Chat service failed'});
  }
});

// -------------------------
// 🎉 /register-toast route
// -------------------------
app.post('/register-toast', async (req, res) => {
  const {name, phone, message} = req.body;
  console.log(`🆕 Register-toast request from ${name || 'לא ידוע'}`);

  try {
    const prompt = `
נרשם חדש בשם ${name} (טלפון: ${phone}) מבקש הודעת ברכה בעברית.
הודעה מקורית: "${message}"
    `;
    const reply = await askAI(prompt);
    logConversation(name, phone, message, reply);
    res.json({ok: true, reply});
  } catch (error) {
    console.error('❌ Register-toast failed:', error.message);
    res.status(500).json({ok: false, error: 'Register toast failed'});
  }
});

// -------------------------
// 🟢 Start Server
// -------------------------
console.log('🚀 Server file loaded. Starting Express...');
app.listen(PORT, () => {
  console.log(`✅ Node server running on http://localhost:${PORT}`);
});

// Optional: Exit tracking
process.on('exit', () => console.log('🔻 Node process exited.'));
process.on('uncaughtException', (err) => console.error('💥 Uncaught exception:', err));
