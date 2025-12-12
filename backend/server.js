const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Hugging Face Paketi Kontrolü
let HfInference;
let ai;
const MODEL_NAME = "gpt2"; // Ücretsiz ve hızlı bir metin oluşturma modeli

try {
    HfInference = require("@huggingface/inference").HfInference;
    // Hugging Face API bağlantısı (API anahtarı olmadan çalışır)
    ai = new HfInference(); 
} catch (e) {
    console.error("KRİTİK HATA: Hugging Face paketi başlatılamadı!", e.message);
    ai = null; 
}

// Model dosyasını çağırma
const Budget = require('./models/Budget');

const app = express();
app.use(cors());
app.use(express.json());

// Veritabanı Bağlantısı
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ DB Bağlandı"))
    .catch(err => console.error("❌ DB Bağlantı Hatası:", err));

// ==========================================================
// API YOLLARI
// ==========================================================

// 1. GİRİŞ (Login)
app.post('/api/login', async (req, res) => {
    try {
        const { username } = req.body;
        const user = await Budget.findOne({ username }); 
        if (user) res.json({ success: true });
        else res.status(404).json({ error: "Kullanıcı bulunamadı. Lütfen kayıt olun." });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. KAYIT (Register)
app.post('/api/register', async (req, res) => {
    try {
        const { username } = req.body;
        if(await Budget.findOne({ username })) return res.status(400).json({ error: "Bu kullanıcı adı zaten alınmış." });
        await new Budget({ username }).save();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. VERİ GETİR (GET /api/budget)
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

// 4. VERİ KAYDET (POST /api/budget)
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
        res.status(500).json({ error: "Kaydetme başarısız: " + e.message });
    }
});

// 5. YAPAY ZEKA ANALİZİ (GET) - HUGGING FACE VERSİYONU
app.get('/api/analyze', async (req, res) => {
    try {
        if (!ai) {
            return res.status(500).json({ error: "AI servisi kapalı. Hugging Face paketi başlatılamadı." });
        }
        
        const { username, income, expenses, net, dailyLimit } = req.query;

        const prompt = `
            Kullanıcı: ${username}. Aylık Gelir: ${income} TL. Aylık Gider: ${expenses} TL. Net Bütçe: ${net} TL.
            Bu bütçe verilerine dayanarak, kullanıcıya hitap eden 100 kelimelik bir finansal analiz yap ve 3 tane kişiselleştirilmiş finansal tavsiye ver. Tavsiyeleri kısa ve madde madde listele. Cevabı sadece analiz ve tavsiyeler olarak Türkçe yaz.
        `;

        // Hugging Face API çağrısı
        const response = await ai.textGeneration({
            model: MODEL_NAME,
            inputs: prompt,
            parameters: {
                max_new_tokens: 300,
                temperature: 0.8
            }
        });

        // Yanıt formatı Hugging Face'e göredir.
        const analysisText = response.generated_text || response; 

        res.json({ analysis: analysisText });

    } catch (err) {
        console.error("Yapay Zeka Analiz Hatası:", err);
        // Hugging Face'de hız/kota aşımı olabilir.
        res.status(500).json({ error: "Hugging Face Analiz Hatası: " + err.message });
    }
});

// PORT DİNLEME
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Sunucu Port: ${PORT} üzerinde çalışıyor.`);
});