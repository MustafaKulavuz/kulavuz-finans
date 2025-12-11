// Sunucu adresi (Render.com'daki Backend adresin)
// DİKKAT: Bu linkin sonunda /api OLMALI!
const API_URL = "https://kulavuz-finans.onrender.com/api";
let currentUser = "misafir"; // <-- BU SATIRI EKLE (Varsayılan kullanıcı)
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
  // Eğer kullanıcı giriş yapmadıysa veri çekmeye çalışma
  if (!currentUser || currentUser === "misafir") return; 

  try {
    const res = await fetch(`${API_URL}/budget?user=${currentUser}`);
    
    if (res.ok) {
      const data = await res.json();
      // Gelen veri null olsa bile displayBudget fonksiyonunu boş obje ile koru
      displayBudget(data || {}); 
    }
  } catch (e) {
    console.error("Bütçe çekme hatası:", e);
  }
}

// --- VERİLERİ KAYDET ---
async function saveBudget() {
    // 1. Giriş Kontrolü
    if (!currentUser || currentUser === "misafir") {
        return alert("Lütfen verileri kaydetmek için önce giriş yapın!");
    }

    // 2. Verileri Topla (DOM Elemanlarının DEĞERLERİNİ (.value) alıyoruz)
    // Hata buradaydı: .value eksik olunca kutunun kendisini gönderiyordu.
    const incomeVal = document.getElementById("income").value;
    const rentVal = document.getElementById("rent").value;
    const rentDayVal = document.getElementById("rentDay").value;
    const foodVal = document.getElementById("food").value;
    const transportVal = document.getElementById("transport").value;
    const entertainmentVal = document.getElementById("entertainment").value;
    const usdBirikimVal = document.getElementById("usdBirikim").value;
    const otherVal = document.getElementById("other").value;

    // 3. Sayıya Çevir (parseFloat ile sayı yapıyoruz, boşsa 0 sayıyoruz)
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

    console.log("Gönderilen Veri:", budgetData); // Konsolda kontrol et, { income: 5000, ... } görmelisin

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
            // Hata varsa backend mesajını göster
            throw new Error(result.error || result.message || "Bilinmeyen hata");
        }
    } catch (e) {
        console.error("Kaydetme hatası:", e);
        alert("Kaydetme hatası: " + e.message);
    }
}

// --- HESAPLAMA VE GÖSTERİM ---
function displayBudget(budget) {
  // --- YAPAY ZEKA ANALİZ FONKSİYONU ---
async function fetchAnalysis(budget) {
    if (!currentUser || !budget.income) return; // Veri yoksa analiz etme

    // Giderleri hesapla (Bu kod displayBudget'ta da var, burada tekrarlıyoruz)
    const totalExpenses = (budget.rent || 0) + (budget.food || 0) + (budget.transport || 0) + (budget.entertainment || 0) + (budget.other || 0);
    const netBudget = budget.income - totalExpenses; 
    
    // Günlük limiti hesapla
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
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
            const [analysisPart, suggestionsPart] = fullText.split("Tavsiyeler:");

            // 1. Analizi Yazdır
            document.getElementById("analysis-summary").textContent = analysisPart.trim();
            
            // 2. Tavsiyeleri Maddeleştir (Eğer varsa)
            if (suggestionsPart) {
                 const suggestionsList = suggestionsPart.split(/\d+\.\s*/).filter(item => item.trim() !== '');
                 document.getElementById("suggestions-list").innerHTML = suggestionsList.map(item => `<li>${item.trim()}</li>`).join('');
            } else {
                 document.getElementById("suggestions-list").innerHTML = "<li>Tavsiyeler metinden ayrılamadı.</li>";
            }
            
        } else {
            const errorData = await res.json();
             document.getElementById("analysis-summary").textContent = "Hata: Analiz edilemedi. API anahtarınızı kontrol edin.";
             document.getElementById("suggestions-list").innerHTML = `<li>Hata: ${errorData.error}</li>`;
        }
    } catch (e) {
        console.error("Analiz çağrısı hatası:", e);
        document.getElementById("analysis-summary").textContent = "Bağlantı Hatası: Sunucuya ulaşılamıyor.";
    }
}
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
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const remainingDays = daysInMonth - today.getDate() + 1;

  // 3. Sonuçları Ekranda Göster (Güvenli bir şekilde)
  // document.getElementById elementlerinin varlığını kontrol etmeye gerek yok, HTML'i düzelttik
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
  // ... displayBudget fonksiyonunun sonu ...

  // 3. Sonuçları Ekranda Göster
  // ... diğer kodlar ...
  
  // Burada analizi başlatıyoruz:
  fetchAnalysis(budget); // <-- BU SATIRI EKLE

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
// Giriş Yap
// --- GİRİŞ VE KAYIT İŞLEMLERİ (GERÇEK) ---

// Giriş Yap
async function loginUser() {
    const usernameInput = document.getElementById("login-username").value.trim(); // Boşlukları temizle
    
    if (!usernameInput) return alert("Lütfen kullanıcı adı girin!");

    try {
        // Backend'e sor: Böyle biri var mı?
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: usernameInput })
        });

        const data = await res.json();

        if (res.ok) {
            // BAŞARILI: İçeri al
            currentUser = usernameInput;
            document.getElementById("auth-container").style.display = "none";
            document.getElementById("app-container").style.display = "block";
            fetchBudget(); // Verilerini çek
            alert("Hoş geldiniz, " + currentUser + "! 👋");
        } else {
            // BAŞARISIZ: Hata mesajını göster
            alert(data.error || "Giriş başarısız.");
        }
    } catch (e) {
        console.error("Giriş hatası:", e);
        alert("Sunucuya bağlanılamadı.");
    }
}

// Kayıt Ol
async function registerUser() {
    const usernameInput = document.getElementById("register-username").value.trim();

    if (!usernameInput) return alert("Lütfen kullanıcı adı girin!");

    try {
        // Backend'e söyle: Yeni kayıt aç
        const res = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: usernameInput })
        });

        const data = await res.json();

        if (res.ok) {
            alert("Kayıt Başarılı! ✅ Şimdi giriş yapabilirsiniz.");
            showLogin(); // Giriş ekranına yönlendir
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
  // Formları temizle
  document.getElementById("login-username").value = "";
  document.getElementById("login-password").value = "";
}
