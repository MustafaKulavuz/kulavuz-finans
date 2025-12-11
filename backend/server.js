const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require("@google/genai"); // AI Paketi

// Model dosyasını çağırma
const Budget = require('./models/Budget');

// AI servis bağlantısı
// DİKKAT: Render'da GEMINI_API_KEY ortam değişkeni tanımlı olmalı!
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY); 

const app = express();
app.use(cors());
app.use(express.json());

// Veritabanı Bağlantısı
// Bağlantınız .env dosyasındaki MONGO_URI değişkeninden çekilir.
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ DB Bağlandı"))
    .catch(err => console.error("❌ DB Bağlantı Hatası:", err));

// ==========================================================
// API YOLLARI
// ==========================================================

app.get('/', (req, res) => res.send("Server Aktif! 🚀"));

// 1. GİRİŞ (Login)
app.post('/api/login', async (req, res) => {
    try {
        const { username } = req.body;
        const user = await Budget.findOne({ username });
        if (user) res.json({ success: true });
        else res.status(404).json({ error: "Kullanıcı yok" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. KAYIT (Register)
app.post('/api/register', async (req, res) => {
    try {
        const { username } = req.body;
        if(await Budget.findOne({ username })) return res.status(400).json({ error: "İsim dolu" });
        await new Budget({ username }).save();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. VERİ GETİR (GET)
app.get('/api/budget', async (req, res) => {
    try {
        const username = req.query.user;
        if (!username) return res.json({});
        const data = await Budget.findOne({ username });
        res.json(data || {});
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. VERİ KAYDET (POST)
app.post('/api/budget', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) return res.status(400).json({ error: "Kullanıcı adı EKSİK!" });

        const updated = await Budget.findOneAndUpdate(
            { username: username },
            req.body,
            { new: true, upsert: true, runValidators: true }
        );

        res.json(updated);
    } catch (e) {
        console.error("Kayıt Patladı:", e);
        res.status(500).json({ error: "Detaylı Hata: " + e.message });
    }
});

// 5. YAPAY ZEKA ANALİZİ (GET)
app.get('/api/analyze', async (req, res) => {
    try {
        const { username, income, expenses, net, dailyLimit } = req.query;

        if (!username) {
            return res.status(400).json({ error: "Kullanıcı adı eksik." });
        }

        const prompt = `
            Kullanıcı: ${username}.
            Aylık Gelir: ${income} TL
            Aylık Gider (Toplam): ${expenses} TL
            Net Aylık Bütçe: ${net} TL
            Kalan Günlük Harcama Limiti: ${dailyLimit} TL
            
            Bu bütçe verilerine dayanarak, kullanıcıya hitap eden 100 kelimelik bir analiz yap ve bu analiz sonucunda 3 tane kişiselleştirilmiş finansal tavsiye ver. Tavsiyeleri kısa ve madde madde listele. Cevabı sadece analiz ve tavsiyeler olarak Türkçe yaz.
        `;
        
        // AI'dan içerik üretmesini istiyoruz
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const analysisText = response.text; 

        res.json({ analysis: analysisText });

    } catch (err) {
        console.error("Yapay Zeka Analiz Hatası:", err);
        // Hata durumunda 500 dön ve sebebi Frontend'e ilet
        res.status(500).json({ error: "Analiz servisine erişilemedi veya API hatası: " + err.message });
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Sunucu Port: ${PORT}`));