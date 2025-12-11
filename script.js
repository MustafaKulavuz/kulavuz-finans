// Sunucu adresi (Render.com'daki Backend adresiniz)
const API_URL = "https://kulavuz-finans.onrender.com/api";
let currentUser = "misafir"; // Giriş yapan kullanıcının adını tutar

// ==========================================================
// 1. PİYASA VERİLERİ FONKSİYONU
// ==========================================================
async function fetchExchangeRates() {
  const defaultRate = 35.5; 

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) {
      throw new Error(`API isteği başarısız: ${res.status}`);
    }

    const data = await res.json();
    let rate = data.rates.TRY;
    const ons = 2400; // Ons Altın Varsayılan Fiyatı
    const gram = (ons * rate) / 31.1035;

    document.getElementById("usd-rate").textContent = rate.toFixed(2) + " TL";
    document.getElementById("gold-rate").textContent = gram.toFixed(2) + " TL";
  } catch (e) {
    console.error("Kur çekme hatası:", e);
    document.getElementById("usd-rate").textContent = defaultRate.toFixed(2) + " TL (Hata)";
    document.getElementById("gold-rate").textContent = "Hesaplanamadı";
  }
}

// ==========================================================
// 2. ANALİZ FONKSİYONU (BACKEND'E SORAR)
// ==========================================================
async function fetchAnalysis(budget) {
    if (!currentUser || !budget || !budget.income) return; 

    // Gider ve limit hesaplamaları (Analiz için gerekiyor)
    const totalExpenses = (budget.rent || 0) + (budget.food || 0) + (budget.transport || 0) + (budget.entertainment || 0) + (budget.other || 0);
    const netBudget = budget.income - totalExpenses; 
    
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - today.getDate() + 1;
    const dailyLimit = remainingDays > 0 ? (netBudget / remainingDays) : 0;

    // Loading mesajını göster
    document.getElementById("analysis-summary").textContent = "Yapay zeka analiz ediliyor, lütfen bekleyin...";
    document.getElementById("suggestions-list").innerHTML = "<li>Analiz yükleniyor...</li>";

    try {
        // Backend'deki analiz yolunu çağır
        const res = await fetch(`${API_URL}/analyze?username=${currentUser}&income=${budget.income}&expenses=${totalExpenses}&net=${netBudget}&dailyLimit=${dailyLimit.toFixed(2)}`);
        
        if (res.ok) {
            const data = await res.json();
            const fullText = data.analysis;

            // Analiz ve tavsiyeleri ayır
            const parts = fullText.split("Tavsiyeler:");
            const analysisPart = parts[0];
            const suggestionsPart = parts.length > 1 ? parts[1] : '';

            document.getElementById("analysis-summary").textContent = analysisPart.trim();
            
            if (suggestionsPart) {
                 const suggestionsList = suggestionsPart.split(/\d+\.\s*/).filter(item => item.trim() !== '');
                 document.getElementById("suggestions-list").innerHTML = suggestionsList.map(item => `<li>${item.trim()}</li>`).join('');
            } else {
                 document.getElementById("suggestions-summary").textContent += " [Tavsiye metni formatı hatalı.]";
                 document.getElementById("suggestions-list").innerHTML = "<li>Analiz başarılı, ancak tavsiye formatı ayrıştırılamadı.</li>";
            }
        } else {
            const errorData = await res.json();
             document.getElementById("analysis-summary").textContent = "Hata: Analiz edilemedi. API anahtarınızı kontrol edin.";
             document.getElementById("suggestions-list").innerHTML = `<li>Hata: ${errorData.error}</li>`;
        }
    } catch (e) {
        console.error("Analiz çağrısı hatası:", e);
        document.getElementById("analysis-summary").textContent = "Bağlantı Hatası: Sunucuya ulaşılamıyor veya API Key hatalı.";
    }
}


// ==========================================================
// 3. EKRANA GÖSTERİM VE HESAPLAMA FONKSİYONU
// ==========================================================
function displayBudget(budget) {
  // Eğer budget null gelirse boş bir obje ata ki çökmesin
  if (!budget) budget = {};

  // Değerleri alırken "|| 0" kullanarak, veri yoksa 0 saymasını sağla
  const income = budget.income || 0;
  const rent = budget.rent || 0;
  const food = budget.food || 0;
  const transport = budget.transport || 0;
  const entertainment = budget.entertainment || 0;
  const other = budget.other || 0;
  const rentDay = budget.rentDay || 1;

  // 1. Giderleri Hesapla
  const totalExpenses = rent + food + transport + entertainment + other;
  const netBudget = income - totalExpenses; 

  // 2. Günlük Bütçe Hesaplama
  const today = new Date();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, today.getMonth() + 1, 0).getDate();
  const remainingDays = daysInMonth - today.getDate() + 1;

  // 3. Sonuçları Ekranda Göster
  document.getElementById("total-income").textContent = income.toLocaleString() + " TL";
  document.getElementById("total-expense").textContent = totalExpenses.toLocaleString() + " TL";
  document.getElementById("net-budget").textContent = netBudget.toLocaleString() + " TL";

  // Renklendirme
  const netElement = document.getElementById("net-budget");
  if(netBudget < 0) netElement.style.color = "red";
  else netElement.style.color = "green";

  // Günlük limit
  const dailyLimit = remainingDays > 0 ? (netBudget / remainingDays) : 0;
  document.getElementById("daily-limit").textContent = dailyLimit.toFixed(2).toLocaleString() + " TL";
  
  // Analizi Başlat (Veri gösterildikten sonra)
  fetchAnalysis(budget);
}


// ==========================================================
// 4. VERİ TABANI ÇEKME VE KAYDETME
// ==========================================================

async function fetchBudget() {
  if (!currentUser || currentUser === "misafir") return; 

  try {
    const res = await fetch(`${API_URL}/budget?user=${currentUser}`);
    
    if (res.ok) {
      const data = await res.json();
      displayBudget(data || {}); 
    }
  } catch (e) {
    console.error("Bütçe çekme hatası:", e);
  }
}

async function saveBudget() {
    if (!currentUser || currentUser === "misafir") {
        return alert("Lütfen verileri kaydetmek için önce giriş yapın!");
    }

    // Doğru: Her zaman .value kullanıyoruz ve parseFloat ile sayıya çeviriyoruz
    const incomeVal = document.getElementById("income").value;
    const rentVal = document.getElementById("rent").value;
    const rentDayVal = document.getElementById("rentDay").value;
    const foodVal = document.getElementById("food").value;
    const transportVal = document.getElementById("transport").value;
    const entertainmentVal = document.getElementById("entertainment").value;
    const usdBirikimVal = document.getElementById("usdBirikim").value;
    const otherVal = document.getElementById("other").value;

    const budgetData = {
        username: currentUser, 
        income: parseFloat(incomeVal) || 0,
        rent: parseFloat(rentVal) || 0,
        rentDay: parseFloat(rentDayVal) || 1,
        food: parseFloat(foodVal) || 0,
        transport: parseFloat(transportVal) || 0,
        entertainment: parseFloat(entertainmentVal) || 0,
        usdBirikim: parseFloat(usdBirikimVal) || 0,
        other: parseFloat(otherVal) || 0
    };

    console.log("Gönderilen Veri:", budgetData);

    try {
        const res = await fetch(`${API_URL}/budget`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(budgetData),
        });

        const result = await res.json();

        if (res.ok) {
            displayBudget(result); 
            alert("✅ Veriler Başarıyla Kaydedildi!");
        } else {
            throw new Error(result.error || result.message || "Bilinmeyen sunucu hatası");
        }
    } catch (e) {
        console.error("Kaydetme hatası:", e);
        alert("Kaydetme hatası: " + e.message);
    }
}

// ==========================================================
// 5. GİRİŞ/KAYIT FONKSİYONLARI
// ==========================================================

// Giriş Yap
async function loginUser() {
    const usernameInput = document.getElementById("login-username").value.trim();
    
    if (!usernameInput) return alert("Lütfen kullanıcı adı girin!");

    const loginBtn = document.querySelector("#login-form button");
    loginBtn.textContent = "Kontrol ediliyor...";
    loginBtn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: usernameInput })
        });

        const data = await res.json();

        if (res.ok) {
            currentUser = usernameInput;
            document.getElementById("auth-container").style.display = "none";
            document.getElementById("app-container").style.display = "block";
            fetchBudget(); 
            alert("Giriş Başarılı! Hoş geldiniz.");
        } else {
            alert(data.error || "Giriş başarısız.");
        }
    } catch (e) {
        console.error("Giriş Hatası:", e);
        alert("Sunucuya bağlanılamadı. İnternetinizi kontrol edin.");
    } finally {
        loginBtn.textContent = "Giriş Yap";
        loginBtn.disabled = false;
    }
}

// Kayıt Ol
async function registerUser() {
    const usernameInput = document.getElementById("register-username").value.trim();

    if (!usernameInput) return alert("Lütfen kullanıcı adı girin!");

    try {
        const res = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: usernameInput })
        });

        const data = await res.json();

        if (res.ok) {
            alert("Kayıt Başarılı! ✅ Şimdi giriş yapabilirsiniz.");
            showLogin(); 
        } else {
            alert(data.error || "Kayıt yapılamadı.");
        }
    } catch (e) {
        console.error("Kayıt hatası:", e);
        alert("Sunucu hatası.");
    }
}

// Çıkış Yap
function logoutUser() {
  document.getElementById("app-container").style.display = "none";
  document.getElementById("auth-container").style.display = "block";
  currentUser = "misafir"; // Kullanıcıyı sıfırla
  // Formları temizle
  document.getElementById("login-username").value = "";
  document.getElementById("login-password").value = "";
}

// Kayıt Formunu Göster
function showRegister() {
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "block";
}

// Giriş Formunu Göster
function showLogin() {
  document.getElementById("register-form").style.display = "none";
  document.getElementById("login-form").style.display = "block";
}


// ==========================================================
// 6. BAŞLANGIÇ ÇAĞRILARI
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
  fetchExchangeRates(); 
  fetchBudget(); 

  // Kaydet butonuna event listener ekle
  document.getElementById("saveButton").addEventListener("click", saveBudget);
});