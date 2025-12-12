const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// AI require satırları silindi

// Model dosyasını çağırma (models/Budget.js olduğunu varsayar)
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

// 4. VERİ KAYDET (POST /api/budget) - [ÇALIŞAN VERİ KAYIT YOLU]
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

// 5. YAPAY ZEKA ANALİZİ YOLU KALDIRILDI.

// PORT DİNLEME
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Sunucu Port: ${PORT} üzerinde çalışıyor.`);
});