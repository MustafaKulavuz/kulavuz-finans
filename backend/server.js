const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// DeepSeek için OpenAI SDK'sını kullanıyoruz
let OpenAI; // Değişkeni dışarıda tanımlıyoruz
let ai;

try {
    // 1. Önce paketi bulmayı dene (Paket yoksa burada hata verir)
    OpenAI = require("openai").OpenAI; 
    
    // 2. Ardından servisi başlatmayı dene (Anahtar yoksa burada hata verir)
    ai = new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: "https://api.deepseek.com/v1"
    });
} catch (e) {
    // Hata paketle ilgili mi (MODULE_NOT_FOUND) yoksa anahtarla ilgili mi?
    if (e.code === 'MODULE_NOT_FOUND') {
        console.error("KRİTİK HATA: OpenAI paketi bulunamıyor! Lütfen 'npm install openai' komutunu çalıştırın.");
    } else {
        console.error("KRİTİK HATA: OpenAI servisi başlatılamadı! Anahtarı kontrol edin. Detay:", e.message);
    }
    ai = null;
}


// Model dosyasını çağırma
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
        // Kullanıcıyı Budget modelinde arıyoruz
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
        
        // Yeni Budget belgesi oluşturup kaydediyoruz
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
        
        // Kullanıcının bütçe verilerini çek
        const data = await Budget.findOne({ username });
        res.json(data || {});
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. VERİ KAYDET (POST /api/budget)
app.post('/api/budget', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) return res.status(400).json({ error: "Kullanıcı adı EKSİK!" });

        // Veriyi bul ve güncelle, yoksa yeni oluştur
        const updated = await Budget.findOneAndUpdate(
            { username: username },
            req.body,
            { new: true, upsert: true, runValidators: true }
        );

        res.json(updated);
    } catch (e) {
        console.error("Kaydetme Hatası:", e);
        res.status(500).json({ error: "Kaydetme başarısız: " + e.message });
    }
});


// 5. YAPAY ZEKA ANALİZİ (GET) - DeepSeek Entegrasyonu
app.get('/api/analyze', async (req, res) => {
    try {
        if (!ai) {
            return res.status(500).json({ error: "AI servisi kapalı. Lütfen sunucu loglarını ve 'npm install openai' kontrol edin." });
        }
        
        const { username, income, expenses, net, dailyLimit } = req.query;

        if (!username) {
            return res.status(400).json({ error: "Kullanıcı adı eksik." });
        }
        
        // Anahtar kontrolü
        if (!process.env.DEEPSEEK_API_KEY) {
            return res.status(500).json({ error: "API Anahtarı (DEEPSEEK_API_KEY) ortam değişkenlerinde tanımlı değil!" });
        }

        const prompt = `
            Kullanıcı: ${username}.
            Aylık Gelir: ${income} TL
            Aylık Gider (Toplam): ${expenses} TL
            Net Aylık Bütçe: ${net} TL
            Kalan Günlük Harcama Limiti: ${dailyLimit} TL
            
            Bu bütçe verilerine dayanarak, kullanıcıya hitap eden 100 kelimelik bir analiz yap ve bu analiz sonucunda 3 tane kişiselleştirilmiş finansal tavsiye ver. Tavsiyeleri kısa ve madde madde listele. Cevabı sadece analiz ve tavsiyeler olarak Türkçe yaz.
        `;

        // DeepSeek API çağrısı
        const response = await ai.chat.completions.create({
            model: 'deepseek-chat', 
            messages: [{ role: "user", content: prompt }],
            max_tokens: 400, // Çıktıyı sınırla
        });

        const analysisText = response.choices[0].message.content; 

        res.json({ analysis: analysisText });

    } catch (err) {
        console.error("Yapay Zeka Analiz Hatası:", err);
        // Hata API Key'den kaynaklanıyorsa detaylı mesaj ver.
        res.status(500).json({ error: "Analiz Hatası: DeepSeek bağlantı hatası veya anahtar geçersiz. " + err.message });
    }
});


// ==========================================================
// PORT DİNLEME
// ==========================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Sunucu Port: ${PORT} üzerinde çalışıyor.`);
});