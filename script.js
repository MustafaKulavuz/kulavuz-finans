// ==========================================================
// KÜRESEL AYARLAR VE DEĞİŞKENLER
// ==========================================================

// Render üzerindeki Backend adresiniz
// Proje adınız kulavuz-tekstil-v2 olduğu için bu adresi kullanıyoruz.
const API_URL = "https://kulavuz-tekstil-v2.onrender.com/api"; 

// Kullanıcı Adı (Global veya Local Storage'dan çekilir)
let currentUsername = localStorage.getItem('username') || '';

// DOM Elementleri
const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const usernameDisplay = document.getElementById('username-display');
const budgetDisplay = document.getElementById('budget-display');
const analysisDiv = document.getElementById('analysis-output');
const dailyLimitSpan = document.getElementById('daily-limit');
const incomeInput = document.getElementById('income');
const rentInput = document.getElementById('rent');
const foodInput = document.getElementById('food');
const transportInput = document.getElementById('transport');
const funInput = document.getElementById('fun');
const otherInput = document.getElementById('other');
const currencyDisplay = document.getElementById('currency-display');
const currencySelect = document.getElementById('currency');

// ==========================================================
// GİRİŞ / KAYIT / KULLANICI YÖNETİMİ
// ==========================================================

function updateUI() {
    if (currentUsername) {
        loginSection.style.display = 'none';
        appSection.style.display = 'block';
        usernameDisplay.textContent = currentUsername;
        loadBudget(currentUsername);
        fetchExchangeRates(); // Kur bilgisini yükle
    } else {
        loginSection.style.display = 'block';
        appSection.style.display = 'none';
        usernameDisplay.textContent = '';
        analysisDiv.innerHTML = '';
    }
}

async function loginUser() {
    const username = document.getElementById('login-username').value.trim();
    if (!username) {
        alert("Lütfen bir kullanıcı adı giriniz.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('username', username);
            currentUsername = username;
            updateUI();
            alert("Giriş başarılı!");
        } else {
            alert("Giriş Hatası: " + data.error);
        }
    } catch (error) {
        console.error("Giriş Hatası:", error);
        alert("Giriş Hatası: Sunucuya ulaşılamıyor veya ağ bağlantısı hatası.");
    }
}

async function registerUser() {
    const username = document.getElementById('login-username').value.trim();
    if (!username) {
        alert("Lütfen bir kullanıcı adı giriniz.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
        } else {
            alert("Kayıt Hatası: " + data.error);
        }
    } catch (error) {
        console.error("Kayıt Hatası:", error);
        alert("Kayıt Hatası: Sunucuya ulaşılamıyor veya ağ bağlantısı hatası.");
    }
}

function logoutUser() {
    localStorage.removeItem('username');
    currentUsername = '';
    updateUI();
    // Sayfayı tamamen yenile
    window.location.reload(); 
}

// ==========================================================
// BÜTÇE YÖNETİMİ VE HESAPLAMALAR
// ==========================================================

async function loadBudget(username) {
    try {
        const response = await fetch(`${API_URL}/budget?user=${username}`);
        if (!response.ok) throw new Error("Veri yüklenemedi");
        
        const data = await response.json();

        if (data && data.budget) {
            incomeInput.value = data.budget.income || '';
            rentInput.value = data.budget.rent || '';
            foodInput.value = data.budget.food || '';
            transportInput.value = data.budget.transport || '';
            funInput.value = data.budget.fun || '';
            otherInput.value = data.budget.other || '';
        }
        displayBudget();

    } catch (error) {
        console.error("Bütçe Yükleme Hatası:", error);
    }
}

function calculateBudget() {
    const income = parseFloat(incomeInput.value) || 0;
    const rent = parseFloat(rentInput.value) || 0;
    const food = parseFloat(foodInput.value) || 0;
    const transport = parseFloat(transportInput.value) || 0;
    const fun = parseFloat(funInput.value) || 0;
    const other = parseFloat(otherInput.value) || 0;

    const totalExpenses = rent + food + transport + fun + other;
    const netBudget = income - totalExpenses;
    
    // Basit bir aylık gün hesaplaması
    const daysInMonth = 30; 
    const dailyLimit = netBudget > 0 ? (netBudget / daysInMonth).toFixed(2) : 0;

    return { income, totalExpenses, netBudget, dailyLimit };
}

function displayBudget() {
    const { income, totalExpenses, netBudget, dailyLimit } = calculateBudget();
    
    budgetDisplay.innerHTML = `
        <p>Toplam Gelir: <strong>${income.toFixed(2)} TL</strong></p>
        <p>Toplam Gider: <strong>${totalExpenses.toFixed(2)} TL</strong></p>
        <p>Net Kalan Bütçe: <strong>${netBudget.toFixed(2)} TL</strong></p>
    `;

    dailyLimitSpan.textContent = dailyLimit + ' TL';

    // Sadece net bütçe pozitifse analizi çağır
    if (netBudget > 0) {
        fetchAnalysis({
            income: income.toFixed(2),
            expenses: totalExpenses.toFixed(2),
            net: netBudget.toFixed(2),
            dailyLimit: dailyLimit
        });
    } else {
        analysisDiv.innerHTML = '<p class="error-text">Analiz için net bütçenin pozitif olması gerekir.</p>';
    }
}

async function saveBudget() {
    const budgetData = calculateBudget();
    
    const budgetPayload = {
        username: currentUsername,
        budget: {
            income: budgetData.income,
            rent: parseFloat(rentInput.value) || 0,
            food: parseFloat(foodInput.value) || 0,
            transport: parseFloat(transportInput.value) || 0,
            fun: parseFloat(funInput.value) || 0,
            other: parseFloat(otherInput.value) || 0,
        }
    };

    try {
        const response = await fetch(`${API_URL}/budget`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(budgetPayload)
        });

        if (response.ok) {
            displayBudget();
            alert("Bütçe verileri kaydedildi ve analiz başlatıldı.");
        } else {
            const data = await response.json();
            alert("Kaydetme Hatası: " + data.error);
        }
    } catch (error) {
        console.error("Kaydetme Hatası:", error);
        alert("Kaydetme Hatası: Sunucuya ulaşılamıyor.");
    }
}

// ==========================================================
// YAPAY ZEKA ANALİZİ (HUGGING FACE)
// ==========================================================

async function fetchAnalysis({ income, expenses, net, dailyLimit }) {
    analysisDiv.innerHTML = '<p>Analiz bekleniyor...</p>';

    try {
        // Tüm veriler URL sorgu parametreleri olarak gönderiliyor
        const query = new URLSearchParams({
            username: currentUsername,
            income,
            expenses,
            net,
            dailyLimit
        }).toString();

        const response = await fetch(`${API_URL}/analyze?${query}`);
        
        const data = await response.json();

        if (response.ok) {
            // Yanıt genellikle çok uzun ve gereksiz metin içerir, temizlenmeli.
            let analysis = data.analysis;

            // Hugging Face GPT-2'den gelen gürültüyü temizle
            analysis = analysis.replace(new RegExp(query, 'g'), '');
            analysis = analysis.substring(analysis.indexOf(' TL') + 3); // İlk TL'den sonrasını al
            analysis = analysis.trim();

            analysisDiv.innerHTML = `<pre>${analysis}</pre>`;
        } else {
            // API'den gelen hatayı göster (Örn: AI servisi kapalı, API anahtarı hatalı)
            analysisDiv.innerHTML = `<p class="error-text">Hata: Analiz edilemedi. ${data.error || 'Bilinmeyen Hata'}</p>`;
        }
    } catch (error) {
        console.error("Analiz Fetch Hatası:", error);
        analysisDiv.innerHTML = `<p class="error-text">Bağlantı Hatası: Sunucuya ulaşılamıyor veya API yolları hatalı.</p>`;
    }
}

// ==========================================================
// KUR BİLGİSİ
// ==========================================================

async function fetchExchangeRates() {
    const selectedCurrency = currencySelect.value;
    if (selectedCurrency === 'USD') {
        currencyDisplay.textContent = '₺1 = $0.030'; // Varsayılan değer
        return;
    }

    try {
        // Ücretsiz ve güvenilir bir kur API'si
        const response = await fetch(`https://open.er-api.com/v6/latest/TRY`);
        if (!response.ok) throw new Error("Kur çekme hatası");

        const data = await response.json();
        
        if (data.rates && data.rates[selectedCurrency]) {
            const rate = data.rates[selectedCurrency].toFixed(4);
            currencyDisplay.textContent = `₺1 = ${selectedCurrency}${rate}`;
        } else {
            throw new Error("Geçerli kur bulunamadı");
        }

    } catch (error) {
        console.error("Kur çekme hatası:", error);
        currencyDisplay.textContent = 'Kur çekilemedi';
    }
}

// ==========================================================
// BAŞLANGIÇ
// ==========================================================

// Sayfa yüklendiğinde arayüzü güncelle
document.addEventListener('DOMContentLoaded', updateUI);

// Para birimi seçimi değiştiğinde kur bilgisini güncelle
currencySelect.addEventListener('change', fetchExchangeRates);