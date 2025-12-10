const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const Budget = require("./models/Budget"); // Az önce oluşturduğumuz veritabanı modeli

dotenv.config();

const app = express();

// --- AYARLAR ---
app.use(cors()); // Frontend'in bize ulaşmasına izin ver
app.use(express.json()); // Gelen verileri JSON olarak oku

// --- VERİTABANI BAĞLANTISI ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Bağlantısı Başarılı!"))
  .catch((err) => console.error("❌ Bağlantı Hatası:", err));

// --- API YOLLARI (ROUTES) ---

// 1. Kullanıcının verilerini çek (Giriş yapınca çalışır)
app.get("/api/budget/:username", async (req, res) => {
  try {
    const data = await Budget.findOne({ username: req.params.username });
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ message: "Kullanıcı verisi henüz yok" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Verileri Kaydet veya Güncelle (Kaydet butonuna basınca çalışır)
app.post("/api/budget", async (req, res) => {
  const {
    username,
    income,
    rent,
    rentDay,
    mutfak,
    ulasim,
    eglence,
    diger,
    usdBirikim,
  } = req.body;

  try {
    // Varsa güncelle, yoksa yeni oluştur (upsert: true)
    const updatedBudget = await Budget.findOneAndUpdate(
      { username },
      {
        income,
        rent,
        rentDay,
        mutfak,
        ulasim,
        eglence,
        diger,
        usdBirikim,
        lastUpdated: new Date(),
      },
      { new: true, upsert: true }
    );
    res.json(updatedBudget);
  } catch (error) {
    console.error("Kaydetme hatası:", error);
    res.status(500).json({ error: "Veriler kaydedilemedi" });
  }
});

// 3. Dolar Kuru (Frontend hata vermesin diye sahte veri yolluyoruz)
app.get("/api/exchange-rates", (req, res) => {
  res.json({ usd_try: 355.0 }); // 35.50 TL
});

// --- SUNUCUYU BAŞLAT ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`📡 Sunucu ${PORT} portunda yayında...`);
});
