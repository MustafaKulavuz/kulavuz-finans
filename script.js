// ==========================================================
// KÜRESEL AYARLAR VE DEĞİŞKENLER
// ==========================================================

// Render üzerindeki Backend adresiniz
const API_URL = "https://kulavuz-tekstil-v2.onrender.com/api"; 
let currentUsername = localStorage.getItem('username') || '';

// DOM elementlerini global olarak tanımlıyoruz, değerlerini initApp'te alacağız.
let loginSection, appSection, loginUsernameInput, loginPasswordInput, 
    registerUsernameInput, registerPasswordInput, loginForm, registerForm,
    totalIncomeSpan, totalExpenseSpan, netBudgetSpan, analysisDiv, dailyLimitSpan, 
    saveButton, incomeInput, rentInput, foodInput, transportInput, 
    entertainmentInput, usdBirikimInput, otherInput, usdRateSpan, goldRateSpan; 


// ==========================================================
// YARDIMCI FONKSİYONLAR VE BAŞLATMA
// ==========================================================

function initApp() {
    // 1. Tüm DOM Elementleri YALNIZCA BURADA yakalanır (null hatalarını çözer)
    loginSection = document.getElementById('auth-container');
    appSection = document.getElementById('app-container');
    loginUsernameInput = document.getElementById('login-username');
    loginPasswordInput = document.getElementById('login-password');
    registerUsernameInput = document.getElementById('register-username');
    registerPasswordInput = document.getElementById('register-password');
    loginForm = document.getElementById('login-form');
    registerForm = document.getElementById('register-form');
    
    // Uygulama alanındaki Span'ler ve Div'ler
    totalIncomeSpan = document.getElementById('total-income');
    totalExpenseSpan = document.getElementById('total-expense');
    netBudgetSpan = document.getElementById('net-budget');
    analysisDiv = document.getElementById('analysis-summary'); 
    dailyLimitSpan = document.getElementById('daily-limit');
    saveButton = document.getElementById('saveButton'); 
    
    // Giriş alanları (TÜM INPUTLARIN DOĞRU YAKALANDIĞINDAN EMİN OLUNMALI!)
    incomeInput = document.getElementById('income');
    rentInput = document.getElementById('rent');
    foodInput = document.getElementById('food');
    transportInput = document.getElementById('transport');
    entertainmentInput = document.getElementById('entertainment');
    usdBirikimInput = document.getElementById('usdBirikim');
    otherInput = document.getElementById('other');
    
    // Piyasa/Kur alanı
    usdRateSpan = document.getElementById('usd-rate');
    goldRateSpan = document.getElementById('gold-rate');
    
    // 2. Olay Dinleyicileri
    if (saveButton) {
        // HTML'de onclick="saveBudget()" zaten olduğu için bu satır gereksiz
        // saveButton.addEventListener('click', saveBudget); 
    }
    
    // 3. Uygulamanın başlatılması
    updateUI();
    fetchExchangeRates();
}


// ==========================================================
// GİRİŞ / KAYIT / KULLANICI YÖNETİMİ
// ==========================================================

function updateUI() {
    if (loginSection && appSection) {
        if (currentUsername) {
            loginSection.style.display = 'none';
            appSection.style.display = 'flex'; 
            loadBudget(currentUsername);
        } else {
            loginSection.style.display = 'flex';
            appSection.style.display = 'none';
        }
    } else {
        console.error("KRİTİK HATA: HTML'de Gerekli Ana Bölüm ID'leri bulunamadı!");
    }
}

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
    // Parola şu an Backend'de kullanılmıyor, ancak Frontend'de tutulur.
    // const password = loginPasswordInput.value.trim();

    if (!username) {
        alert("Lütfen tüm alanları doldurunuz.");
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
    const username = registerUsernameInput.value.trim();
    // const password = registerPasswordInput.value.trim();

    if (!username) {
        alert("Lütfen geçerli bir kullanıcı adı giriniz.");
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
            showLogin(); 
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
// BÜTÇE YÖNETİMİ VE KAYIT
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
    // KRİTİK: Tüm girişlerin var olduğu varsayılır (initApp'te yakalandı)
    const income = parseFloat(incomeInput.value) || 0;
    const rent = parseFloat(rentInput.value) || 0;
    const food = parseFloat(foodInput.value) || 0;
    const transport = parseFloat(transportInput.value) || 0;
    const entertainment = parseFloat(entertainmentInput.value) || 0;
    const usdBirikim = parseFloat(usdBirikimInput.value) || 0;
    const other = parseFloat(otherInput.value) || 0;

    const totalExpenses = rent + food + transport + entertainment + usdBirikim + other;
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
    
    // [KRİTİK DÜZELTME] Kayıt payload'unu oluştururken,
    // tüm budget verilerini doğru şekilde Backend'e gönderiyoruz.
    const budgetPayload = {
        username: currentUsername, // En önemli kısım: Kayıt için kullanıcı adı
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
// YAPAY ZEKA VE KUR BİLGİSİ
// ==========================================================

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
            
            // Hugging Face yanıt temizliği
            const promptStart = `Kullanıcı: ${currentUsername}. Aylık Gelir: ${income} TL.`;
            let cleanAnalysis = analysis.substring(analysis.indexOf(promptStart) + promptStart.length).trim();
            
            analysisDiv.innerHTML = `<pre>${cleanAnalysis}</pre>`; 
        } else {
            analysisDiv.innerHTML = `<p class="error-text">Hata: Analiz edilemedi. ${data.error || 'Bilinmeyen Hata'}</p>`;
        }
    } catch (error) {
        console.error("Analiz Fetch Hatası:", error);
        analysisDiv.innerHTML = `<p class="error-text">Bağlantı Hatası: Sunucuya ulaşılamıyor veya API yolları hatalı.</p>`;
    }
}

async function fetchExchangeRates() {
    // USD oranı çekme 
    try {
        const response = await fetch(`https://open.er-api.com/v6/latest/USD`);
        const data = await response.json();
        
        if (data.rates && data.rates.TRY && usdRateSpan) {
            const usdToTry = data.rates.TRY.toFixed(2); 
            usdRateSpan.textContent = `1 USD = ${usdToTry} TL`;
        } else if (usdRateSpan) {
            usdRateSpan.textContent = 'Veri çekilemedi';
        }
    } catch (e) {
        if (usdRateSpan) usdRateSpan.textContent = 'Hata';
    }

    // Altın çekme (Placeholder)
    if (goldRateSpan) {
        goldRateSpan.textContent = '4.500 TL (Placeholder)';
    }
}


// ==========================================================
// BAŞLANGIÇ KONTROLÜ
// ==========================================================

// Sayfa yüklendiğinde, önce HTML hazır olsun, sonra DOM'u yakala ve başlat.
document.addEventListener('DOMContentLoaded', initApp);