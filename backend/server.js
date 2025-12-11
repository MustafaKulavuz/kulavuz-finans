const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Budget = require("./models/Budget");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Bağlantısı
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Kulavuz Finans Veritabanı Hazır!"))
  .catch((err) => console.error("❌ Veritabanı Hatası:", err));

// --- API YOLLARI ---

// 1. Bütçeyi Getir (GET)
app.get("/api/budget", async (req, res) => {
  try {
    // Şimdilik sadece tek bir kullanıcının verisini çekiyoruz (basitlik için)
    // Gerçek uygulamada kullanıcıya özel çekilir.
    let budget = await Budget.findOne();

    // Eğer veritabanı boşsa varsayılan boş bir veri döndür
    if (!budget) {
      budget = new Budget({ username: "user1" });
      await budget.save();
    }

    res.json(budget);
  } catch (err) {
    res.status(500).json({ error: "Veri çekilemedi" });
  }
});

// 2. Bütçeyi Kaydet/Güncelle (POST)
app.post("/api/budget", async (req, res) => {
  try {
    // Var olan kaydı bul ve güncelle (yoksa yeni oluştur)
    // 'findOneAndUpdate' komutu: Bul -> Güncelle -> Yoksa Yarat (upsert: true)
    const updatedBudget = await Budget.findOneAndUpdate(
      { username: "c" }, // Script.js'de username="c" demiştik
      req.body,
      { new: true, upsert: true }
    );
    res.json(updatedBudget);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kaydedilemedi" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Finans Sunucusu: http://localhost:${PORT}`)
);
