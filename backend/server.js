const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// AI Paketi Kontrolü
let GoogleGenAI;
try {
    // Paketi dışarıdan alıyoruz
    GoogleGenAI = require("@google/genai").GoogleGenAI;
} catch (e) {
    console.error("KRİTİK HATA: AI PAKETİ BULUNAMADI! Lütfen 'npm install @google/genai' komutunu çalıştırın.");
    GoogleGenAI = null; 
}

// Model dosyasını çağırma
const Budget = require('./models/Budget');

// AI servis bağlantısı
const ai = GoogleGenAI ? new GoogleGenAI(process.env.GEMINI_API_KEY) : null; 

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

// ... (Giriş, Kayıt, Kaydetme yolları burada devam ediyor) ... 

// 5. YAPAY ZEKA ANALİZİ (GET) - (GÜVENLİK EKLENDİ)
app.get('/api/analyze', async (req, res) => {
    try {
        if (!ai) {
             return res.status(500).json({ error: "AI servisi kapalı. Lütfen sunucu loglarını ve 'npm install' kontrol edin." });
        }
        
        const { username, income, expenses, net, dailyLimit } = req.query;

        if (!username) {
            return res.status(400).json({ error: "Kullanıcı adı eksik." });
        }
        
        // API KEY kontrolü (Hata vermemesi için)
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "API Anahtarı (GEMINI_API_KEY) ortam değişkenlerinde tanımlı değil!" });
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

        res.json({ analysis: analysisText });

    } catch (err) {
        console.error("Yapay Zeka Analiz Hatası:", err);
        // Hata API Key'den kaynaklanıyorsa detaylı mesaj ver.
        let errorMessage = err.message.includes("API_KEY_INVALID") ? "API Anahtarınız Hatalı veya Geçersiz." : err.message;
        res.status(500).json({ error: "Analiz Hatası: " + errorMessage });
    }
});
// ... (app.listen ve PORT kısmı burada devam eder) ...
// ==========================================================
// PORT DİNLEME (Bu kod server.js'nin en sonunda olmalıdır)
// ==========================================================

const PORT = process.env.PORT || 5000;

// app.listen komutu sunucuyu başlatır
app.listen(PORT, () => {
    console.log(`🚀 Sunucu Port: ${PORT} üzerinde çalışıyor.`);
});