// Sunucu adresi (Render.com'daki Backend adresin)
// DİKKAT: Bu linkin sonunda /api OLMALI!
const API_URL = "https://kulavuz-finans.onrender.com/api";

// --- PİYASA VERİLERİ (GÜNCEL API) ---
// API Key istemeyen, güncel döviz kurlarını çeken fonksiyon
async function fetchExchangeRates() {
  const defaultRate = 35.5; // API çalışmazsa kullanılacak varsayılan kur

  try {
    // open.er-api.com adresi, API Key istemez ve stabil çalışır
    const res = await fetch("https://open.er-api.com/v6/latest/USD");

    // Eğer yanıt başarısızsa hata fırlat (Örn: 404, 500)
    if (!res.ok) {
      throw new Error(`API isteği başarısız: ${res.status}`);
    }

    const data = await res.json();

    // TRY kurunu çek
    let rate = data.rates.TRY;

    // 1. Dolar Kurunu Güncelle
    document.getElementById("usd-rate").textContent = rate.toFixed(2) + " TL";

    // 2. Altın hesaplama (Gram Altın = Ons * Dolar Kuru / 31.1035)
    const ons = 2400; // Ons Altın Güncel Fiyatı (Bu değeri manuel güncelleyebilirsin)
    const gram = (ons * rate) / 31.1035;
    document.getElementById("gold-rate").textContent = gram.toFixed(2) + " TL";
  } catch (e) {
    console.error("Kur çekme hatası:", e);
    document.getElementById("usd-rate").textContent =
      defaultRate.toFixed(2) + " TL (Hata)";
    document.getElementById("gold-rate").textContent = "Hesaplanamadı";
  }
}

// --- VERİTABANI İŞLEMLERİ ---
async function fetchBudget() {
  try {
    const res = await fetch(`${API_URL}/budget`);
    if (res.ok) {
      const data = await res.json();
      displayBudget(data);
    }
  } catch (e) {
    console.error("Bütçe çekme hatası:", e);
  }
}

async function saveBudget() {
  // 1. Kullanıcıdan Verileri Topla
  const username = "c"; // Kullanıcı adı sabit kalsın
  const income = parseFloat(document.getElementById("income").value) || 0;
  const rent = parseFloat(document.getElementById("rent").value) || 0;
  const food = parseFloat(document.getElementById("food").value) || 0;
  const transport = parseFloat(document.getElementById("transport").value) || 0;
  const entertainment =
    parseFloat(document.getElementById("entertainment").value) || 0;
  const other = parseFloat(document.getElementById("other").value) || 0;
  const rentDay = parseFloat(document.getElementById("rentDay").value) || 0;
  const usdBirikim =
    parseFloat(document.getElementById("usdBirikim").value) || 0;

  const budgetData = {
    username,
    income,
    rent,
    food,
    transport,
    entertainment,
    other,
    rentDay,
    usdBirikim,
  };

  try {
    // 2. Sunucuya POST isteği gönder
    const res = await fetch(`${API_URL}/budget`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(budgetData),
    });

    // 3. Yanıtı Kontrol Et
    if (res.ok) {
      const data = await res.json();
      displayBudget(data);
      alert("Veriler Başarıyla Kaydedildi! 💾");
    } else {
      const errorData = await res.json();
      throw new Error(
        errorData.message || "Kaydetme sırasında bir sunucu hatası oluştu."
      );
    }
  } catch (e) {
    console.error("Kaydetme hatası:", e);
    alert(`Hata: Kaydedilemedi. Lütfen Console'u kontrol edin.`);
  }
}

// --- HESAPLAMA VE GÖSTERİM ---
function displayBudget(budget) {
  // 1. Giderleri Hesapla
  const totalExpenses =
    budget.rent +
    budget.food +
    budget.transport +
    budget.entertainment +
    budget.other;
  const netBudget = budget.income - totalExpenses; // Gelir - Gider

  // 2. Günlük Bütçe Hesaplama
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // Ayın toplam gün sayısı

  const remainingDays = daysInMonth - today.getDate() + 1; // Kalan gün sayısı

  // Kirayı ödenecek tarihe göre hesapla
  let rentDue = new Date(currentYear, currentMonth, budget.rentDay);
  if (rentDue < today) {
    // Kira günü geçtiyse, sonraki aya ait kirayı düşün
    rentDue = new Date(currentYear, currentMonth + 1, budget.rentDay);
  }

  // Basitlik için net bütçe / kalan gün formülü
  const dailyLimit = netBudget / remainingDays;

  // 3. Sonuçları Ekranda Göster
  document.getElementById("total-income").textContent =
    budget.income.toLocaleString() + " TL";
  document.getElementById("total-expense").textContent =
    totalExpenses.toLocaleString() + " TL";
  document.getElementById("net-budget").textContent =
    netBudget.toLocaleString() + " TL";

  document.getElementById("net-budget-display").textContent =
    netBudget.toLocaleString() + " TL";
  document.getElementById("daily-limit").textContent =
    dailyLimit.toFixed(2).toLocaleString() + " TL";
}

// --- BAŞLANGIÇ ---
// Sayfa yüklendiğinde çalışacak ana fonksiyon
document.addEventListener("DOMContentLoaded", () => {
  fetchExchangeRates(); // Kur bilgilerini çek
  fetchBudget(); // Kayıtlı bütçe verilerini çek

  // Butonlara event listener ekle
  document.getElementById("saveButton").addEventListener("click", saveBudget);
});

// --- GİRİŞ VE KAYIT EKRANI GEÇİŞLERİ ---

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

// Giriş Yap (Basit Simülasyon)
function loginUser() {
  const username = document.getElementById("login-username").value;
  if (!username) return alert("Lütfen kullanıcı adı girin!");

  // Giriş ekranını gizle, ana uygulamayı aç
  document.getElementById("auth-container").style.display = "none";
  document.getElementById("app-container").style.display = "block";
  alert("Hoş geldiniz, " + username + "! 👋");
}

// Kayıt Ol (Basit Simülasyon)
function registerUser() {
  const username = document.getElementById("register-username").value;
  if (!username) return alert("Lütfen kullanıcı adı girin!");

  alert("Kayıt Başarılı! ✅ Lütfen giriş yapın.");
  showLogin(); // Otomatik olarak giriş ekranına yönlendir
}

// Çıkış Yap
function logoutUser() {
  document.getElementById("app-container").style.display = "none";
  document.getElementById("auth-container").style.display = "block";
  // Formları temizle
  document.getElementById("login-username").value = "";
  document.getElementById("login-password").value = "";
}
