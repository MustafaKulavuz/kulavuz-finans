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

// 1. Bütçeyi Getir (Hata Korumalı)
app.get('/api/budget', async (req, res) => {
    try {
        const username = req.query.user;
        
        // Eğer kullanıcı adı gelmediyse hata döndürme, boş veri dön
        if (!username || username === "undefined") {
            return res.json({ 
                username: "misafir", income: 0, rent: 0, food: 0, 
                transport: 0, entertainment: 0, other: 0, rentDay: 1, usdBirikim: 0 
            });
        }

        let budget = await Budget.findOne({ username: username });
        
        // Eğer veritabanında kayıt yoksa, varsayılan sıfırları döndür (NULL DÖNDÜRME)
        if (!budget) {
            return res.json({ 
                username: username, income: 0, rent: 0, food: 0, 
                transport: 0, entertainment: 0, other: 0, rentDay: 1, usdBirikim: 0 
            });
        }
        
        res.json(budget);
    } catch (err) {
        console.error("Getirme Hatası:", err);
        res.status(500).json({ error: "Sunucu hatası" });
    }
});

// 2. Bütçeyi Kaydet (Hata Korumalı)
app.post('/api/budget', async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ error: "Kullanıcı adı eksik! Lütfen giriş yapın." });
        }

        // upsert: true -> Varsa güncelle, yoksa yeni oluştur
        const updatedBudget = await Budget.findOneAndUpdate(
            { username: username }, 
            req.body,
            { new: true, upsert: true } 
        );
        
        res.json(updatedBudget);

    } catch (err) {
        console.error("KAYIT HATASI:", err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Sunucu Çalışıyor: http://localhost:${PORT}`));