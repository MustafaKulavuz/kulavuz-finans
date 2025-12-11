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

// 1. Bütçeyi Getir (Kullanıcı Adına Göre)
// Örnek kullanım: /api/budget?user=Mustafa
app.get('/api/budget', async (req, res) => {
    try {
        const username = req.query.user; // Linkten isyi al
        if (!username) return res.json(null); // İsim yoksa boş dön

        let budget = await Budget.findOne({ username: username });
        
        // Eğer bu isimde kayıt yoksa boş bir şablon döndür (hata vermesin)
        if (!budget) {
            return res.json({ username: username, income: 0, expenses: 0 });
        }
        
        res.json(budget);
    } catch (err) {
        console.error("Getirme Hatası:", err);
        res.status(500).json({ error: "Veri çekilemedi: " + err.message });
    }
});

// 2. Bütçeyi Kaydet/Güncelle (DİNAMİK)
app.post('/api/budget', async (req, res) => {
    try {
        // Frontend'den gelen kullanıcı adını al
        const { username } = req.body; 

        if (!username) {
            return res.status(400).json({ error: "Kullanıcı adı eksik!" });
        }

        // O kullanıcı adını bul ve güncelle (Yoksa yeni oluştur)
        const updatedBudget = await Budget.findOneAndUpdate(
            { username: username }, // ARTIK SABİT "c" DEĞİL!
            req.body,
            { new: true, upsert: true } // upsert: true (yoksa yarat demektir)
        );
        
        console.log(`✅ ${username} için veri kaydedildi.`);
        res.json(updatedBudget);

    } catch (err) {
        console.error("KAYIT HATASI:", err);
        // Hatayı frontend'e gönder ki görebilelim
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Finans Sunucusu: http://localhost:${PORT}`));