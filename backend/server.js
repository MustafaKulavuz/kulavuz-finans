const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Model dosyasını çağırma (Eğer dosya yoksa hata verir)
const Budget = require('./models/Budget');

const app = express();
app.use(cors());
app.use(express.json());

// Veritabanı Bağlantısı
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ DB Bağlandı"))
    .catch(err => console.error("❌ DB Bağlantı Hatası:", err));

// --- API YOLLARI ---

app.get('/', (req, res) => res.send("Server Aktif!"));

// GİRİŞ
app.post('/api/login', async (req, res) => {
    const { username } = req.body;
    const user = await Budget.findOne({ username });
    if (user) res.json({ success: true });
    else res.status(404).json({ error: "Kullanıcı yok" });
});

// KAYIT
app.post('/api/register', async (req, res) => {
    const { username } = req.body;
    if(await Budget.findOne({ username })) return res.status(400).json({ error: "İsim dolu" });
    await new Budget({ username }).save();
    res.json({ success: true });
});

// VERİ GETİR
app.get('/api/budget', async (req, res) => {
    const username = req.query.user;
    if (!username) return res.json({});
    const data = await Budget.findOne({ username });
    res.json(data || {});
});

// VERİ KAYDET (İşte burayı konuşturacağız)
app.post('/api/budget', async (req, res) => {
    try {
        console.log("Gelen Veri:", req.body); // Loglara yaz

        const { username } = req.body;
        if (!username) return res.status(400).json({ error: "Kullanıcı adı EKSİK!" });

        // upsert: true -> Yoksa oluştur, varsa güncelle
        const updated = await Budget.findOneAndUpdate(
            { username: username },
            req.body,
            { new: true, upsert: true, runValidators: true } // runValidators: Hatalı veri varsa engelle
        );

        res.json(updated);
    } catch (e) {
        console.error("Kayıt Patladı:", e);
        // HATAYI GİZLEME, DİREKT GÖNDER!
        res.status(500).json({ error: "Detaylı Hata: " + e.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Port: ${PORT}`));

// server.js içine en üste, diğer 'require' satırlarının yanına ekle:
const { GoogleGenAI } = require("@google/genai"); 
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY); 

// --- YENİ ANALİZ YOLU ---

// 5. Yapay Zeka Analizi (GET)
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

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const analysisText = response.text; 

        // Cevabı JSON olarak Frontend'e gönder
        res.json({ analysis: analysisText });

    } catch (err) {
        console.error("Yapay Zeka Analiz Hatası:", err);
        res.status(500).json({ error: "Analiz servisine erişilemedi veya API hatası." });
    }
});