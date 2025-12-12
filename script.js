// ==========================================================
// KÜRESEL AYARLAR VE DEĞİŞKENLER
// ==========================================================

// Render üzerindeki Backend adresiniz
const API_URL = "https://kulavuz-tekstil-v2.onrender.com/api"; 

// Kullanıcı Adı (Global veya Local Storage'dan çekilir)
let currentUsername = localStorage.getItem('username') || '';

// DOM Elementleri - HTML'deki yeni ID'lere uyarlandı
const loginSection = document.getElementById('auth-container'); // DÜZELTİLDİ: 'auth-container'
const appSection = document.getElementById('app-container');   // DÜZELTİLDİ: 'app-container'

// Diğer DOM Elementleri (HTML'inizdeki ID'lere göre güncellendi)
const loginUsernameInput = document.getElementById('login-username');
const registerUsernameInput = document.getElementById('register-username');
const loginPasswordInput = document.getElementById('login-password');
const registerPasswordInput = document.getElementById('register-password');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');


const usernameDisplay = document.getElementById('username-display'); // HTML'inizde yok, ama kalsın
const totalIncomeSpan = document.getElementById('total-income');
const totalExpenseSpan = document.getElementById('total-expense');
const netBudgetSpan = document.getElementById('net-budget');
const analysisDiv = document.getElementById('analysis-summary'); // HTML'de düzeltildi
const dailyLimitSpan = document.getElementById('daily-limit');
const saveButton = document.getElementById('saveButton');

// Gider Girişleri
const incomeInput = document.getElementById('income');
const rentInput = document.getElementById('rent');
const foodInput = document.getElementById('food');
const transportInput = document.getElementById('transport');
const entertainmentInput = document.getElementById('entertainment'); // HTML'deki ID
const usdBirikimInput = document.getElementById('usdBirikim');      // HTML'deki ID
const otherInput = document.getElementById('other');

// ==========================================================
// GİRİŞ / KAYIT / KULLANICI YÖNETİMİ
// ==========================================================

function updateUI() {
    if (loginSection && appSection) {
        if (currentUsername) {
            loginSection.style.display = 'none';
            appSection.style.display = 'flex'; // app-container'ın style'ını ayarla
            // usernameDisplay.textContent = currentUsername; // HTML'de bu span yok
            loadBudget(currentUsername);
        } else {
            loginSection.style.display = 'flex';
            appSection.style.display = 'none';
        }
    }
}

// Yeni: Form gösterme fonksiyonları (HTML'deki onclick olayları için)
function showRegister() {
    if (loginForm && registerForm) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

function showLogin() {
    if (loginForm && registerForm) {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    }
}


async function loginUser() {
    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value.trim(); // HTML'de parola var

    if (!username || !password) {
        alert("Lütfen tüm alanları doldurunuz.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
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
    const username = registerUsernameInput.value.trim();
    const password = registerPasswordInput.value.trim();

    if (!username || !password || password.length < 6) {
        alert("Lütfen geçerli bir kullanıcı adı ve en az 6 karakterli parola giriniz.");
        return;
    }
    
    // NOT: Backend'de parola karşılaştırması yapılmadığı için,
    // sadece kullanıcı adı ile kayıt yapılacaktır.

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }) 
        });

        const data = await response.json();

        if (response.ok) {
            alert("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
            showLogin(); // Kayıttan sonra giriş formunu göster
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
            
            // HTML'de entertainment ve usdBirikim ID'leri var.
            entertainmentInput.value = data.budget.entertainment || '';
            usdBirikimInput.value = data.budget.usdBirikim || '';
            
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
    const entertainment = parseFloat(entertainmentInput.value) || 0; // Yeni
    const usdBirikim = parseFloat(usdBirikimInput.value) || 0;       // Yeni
    const other = parseFloat(otherInput.value) || 0;

    const totalExpenses = rent + food + transport + entertainment + usdBirikim + other; // Tümü toplanır
    const netBudget = income - totalExpenses;
    
    const daysInMonth = 30; 
    const dailyLimit = netBudget > 0 ? (netBudget / daysInMonth).toFixed(2) : 0;

    return { income, totalExpenses, netBudget, dailyLimit };
}

function displayBudget() {
    const { income, totalExpenses, netBudget, dailyLimit } = calculateBudget();
    
    totalIncomeSpan.textContent = `${income.toFixed(2)} TL`;
    totalExpenseSpan.textContent = `${totalExpenses.toFixed(2)} TL`;
    netBudgetSpan.textContent = `${netBudget.toFixed(2)} TL`;

    dailyLimitSpan.textContent = dailyLimit + ' TL';

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
            entertainment: parseFloat(entertainmentInput.value) || 0,
            usdBirikim: parseFloat(usdBirikimInput.value) || 0,
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

// NOT: Bu fonksiyon, server.js'deki /analyze yolunu çağırır
async function fetchAnalysis({ income, expenses, net, dailyLimit }) {
    analysisDiv.innerHTML = '<p>Analiz bekleniyor...</p>';

    try {
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
            let analysis = data.analysis;
            
            // Hugging Face'den gelen girdiyi temizle (Model girdiyi tekrar edebilir)
            const promptStart = `Kullanıcı: ${currentUsername}. Aylık Gelir: ${income} TL.`;
            let cleanAnalysis = analysis.substring(analysis.indexOf(promptStart) + promptStart.length).trim();
            
            // Hâlâ gürültü varsa baştan temizle
            if (cleanAnalysis.startsWith('Bu bütçe verilerine dayanarak,')) {
                cleanAnalysis = cleanAnalysis.substring(cleanAnalysis.indexOf('verilerine dayanarak,')).trim();
            }

            // HTML'inizde <p class="analysis-text" id="analysis-summary"> var
            analysisDiv.innerHTML = `<pre>${cleanAnalysis}</pre>`; 
        } else {
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

// NOT: HTML'de currencySelect ve currencyDisplay ID'leri yok, 
// o yüzden bu fonksiyon şimdilik sadece varsayılanı kullanır.
async function fetchExchangeRates() {
    // HTML'inizdeki ID'lere göre uyarlanmıştır
    const usdRateSpan = document.getElementById('usd-rate');
    const goldRateSpan = document.getElementById('gold-rate');
    
    // USD oranı çekme (varsayılan)
    try {
        const response = await fetch(`https://open.er-api.com/v6/latest/USD`);
        const data = await response.json();
        
        if (data.rates && data.rates.TRY) {
             // 1 USD kaç TL
            const usdToTry = data.rates.TRY.toFixed(2); 
            usdRateSpan.textContent = `1 USD = ${usdToTry} TL`;
        } else {
            usdRateSpan.textContent = 'Veri çekilemedi';
        }
    } catch (e) {
        usdRateSpan.textContent = 'Hata';
    }

    // Altın çekme (HTML'de ID var, ama API yok, sadece placeholder)
    goldRateSpan.textContent = '4.500 TL (Placeholder)';
}

// ==========================================================
// BAŞLANGIÇ
// ==========================================================

// Giriş butonuna tıklanınca saveBudget fonksiyonunu çağır
if (saveButton) {
    saveButton.addEventListener('click', saveBudget);
}

// Sayfa yüklendiğinde arayüzü güncelle
document.addEventListener('DOMContentLoaded', updateUI);
document.addEventListener('DOMContentLoaded', fetchExchangeRates);