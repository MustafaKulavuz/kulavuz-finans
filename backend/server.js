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
// --- YENİ EKLENEN GÜVENLİK YOLLARI ---

// 3. GİRİŞ YAP (Kontrol Et)
app.post('/api/login', async (req, res) => {
    try {
        const { username } = req.body;
        // Bu isimde bir bütçe/kullanıcı kaydı var mı?
        const user = await Budget.findOne({ username: username });

        if (user) {
            res.json({ success: true, message: "Giriş Başarılı" });
        } else {
            res.status(404).json({ error: "Kullanıcı bulunamadı! Lütfen önce kayıt olun." });
        }
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası" });
    }
});

// 4. KAYIT OL (Yeni Kullanıcı Oluştur)
app.post('/api/register', async (req, res) => {
    try {
        const { username } = req.body;
        
        // Önce var mı diye bak, varsa hata ver (Aynı isimden 2 tane olmasın)
        const existingUser = await Budget.findOne({ username: username });
        if (existingUser) {
            return res.status(400).json({ error: "Bu kullanıcı adı zaten alınmış." });
        }

        // Yoksa yeni oluştur
        const newBudget = new Budget({ username: username });
        await newBudget.save();

        res.json({ success: true, message: "Kayıt Başarılı" });
    } catch (err) {
        res.status(500).json({ error: "Kayıt hatası" });
    }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Sunucu Çalışıyor: http://localhost:${PORT}`));