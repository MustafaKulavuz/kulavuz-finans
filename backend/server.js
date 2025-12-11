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