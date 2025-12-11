const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Budget = require('./models/Budget');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Bağlantısı
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Kulavuz Finans Veritabanı Hazır!"))
    .catch(err => console.error("❌ Veritabanı Hatası:", err));

// --- API YOLLARI ---

// 1. GİRİŞ YAP
app.post('/api/login', async (req, res) => {
    try {
        const { username } = req.body;
        const user = await Budget.findOne({ username: username });
        if (user) {
            res.json({ success: true, message: "Giriş Başarılı" });
        } else {
            res.status(404).json({ error: "Kullanıcı bulunamadı!" });
        }
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası" });
    }
});

// 2. KAYIT OL
app.post('/api/register', async (req, res) => {
    try {
        const { username } = req.body;
        const existingUser = await Budget.findOne({ username: username });
        if (existingUser) return res.status(400).json({ error: "Bu isim alınmış." });

        const newBudget = new Budget({ username: username });
        await newBudget.save();
        res.json({ success: true, message: "Kayıt Başarılı" });
    } catch (err) {
        res.status(500).json({ error: "Kayıt hatası" });
    }
});

// 3. BÜTÇE GETİR (GET)
app.get('/api/budget', async (req, res) => {
    try {
        const username = req.query.user;
        if (!username) return res.json({}); 
        const budget = await Budget.findOne({ username: username });
        res.json(budget || {});
    } catch (err) {
        res.status(500).json({ error: "Veri çekilemedi" });
    }
});

// 4. BÜTÇE KAYDET (POST) - İŞTE BU EKSİK OLABİLİR!
app.post('/api/budget', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) return res.status(400).json({ error: "Kullanıcı adı yok!" });

        const updatedBudget = await Budget.findOneAndUpdate(
            { username: username }, 
            req.body,
            { new: true, upsert: true } 
        );
        res.json(updatedBudget);
    } catch (err) {
        console.error("Kayıt Hatası:", err); // Loglara hatayı yazdır
        res.status(500).json({ error: "Kaydedilemedi" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Sunucu: http://localhost:${PORT}`));