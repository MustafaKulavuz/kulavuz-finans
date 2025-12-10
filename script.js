// ===============================================================
//  KULAVUZ FİNANS – FULL STACK (MONGODB) SÜRÜMÜ
// ===============================================================

// Backend adresimiz (Sunucunun çalıştığı adres)
const API_URL = "https://kulavuz-finans.onrender.com/api";

let chartInstance = null;

// Sayfa Yüklendiğinde
document.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus();
  fetchExchangeRates();
});

// --- PİYASA VERİLERİ ---
async function fetchExchangeRates() {
  try {
    // Sunucudan dolar kurunu al
    const res = await fetch(`${API_URL}/exchange-rates`);
    const data = await res.json();
    const rate = data.usd_try ? data.usd_try / 10 : 35.5;

    document.getElementById("usd-rate").textContent = rate.toFixed(2) + " TL";

    // Altın hesaplama
    const ons = 2600;
    const gram = (ons * rate) / 31.1035;
    document.getElementById("gold-rate").textContent = gram.toFixed(2) + " TL";
  } catch (e) {
    console.log("Kur hatası:", e);
    document.getElementById("usd-rate").textContent = "35.50 TL";
  }
}

// --- GİRİŞ / KAYIT ---
function checkLoginStatus() {
  const user = localStorage.getItem("currentUsername");
  const auth = document.getElementById("auth-container");
  const app = document.getElementById("app-container");

  if (user) {
    auth.style.display = "none";
    app.style.display = "block";
    loadData(); // Veritabanından verileri çek!
  } else {
    auth.style.display = "block";
    app.style.display = "none";
  }
}

function showRegister() {
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "block";
}

function showLogin() {
  document.getElementById("login-form").style.display = "block";
  document.getElementById("register-form").style.display = "none";
}

// Kayıt ve Giriş (Basitleştirilmiş)
function registerUser() {
  const username = document
    .getElementById("register-username")
    .value.toLowerCase();
  if (!username) return alert("Kullanıcı adı giriniz");

  localStorage.setItem("currentUsername", username);
  customAlert("Başarılı", "Giriş yapılıyor...");
  checkLoginStatus();
}

function loginUser() {
  const username = document
    .getElementById("login-username")
    .value.toLowerCase();
  if (!username) return alert("Kullanıcı adı giriniz");

  localStorage.setItem("currentUsername", username);
  checkLoginStatus();
}

function logoutUser() {
  localStorage.removeItem("currentUsername");
  checkLoginStatus();
}

// --- VERİ KAYDETME (DATABASE'E YOLLAR) ---
async function saveData() {
  const username = localStorage.getItem("currentUsername");
  if (!username) return;

  const data = {
    username: username,
    income: parseFloat(document.getElementById("monthly-income").value) || 0,
    rent: parseFloat(document.getElementById("rent-expense").value) || 0,
    rentDay: parseInt(document.getElementById("rent-day").value) || 1,
    mutfak: parseFloat(document.getElementById("mutfak-expense").value) || 0,
    ulasim: parseFloat(document.getElementById("ulasim-expense").value) || 0,
    eglence: parseFloat(document.getElementById("eglence-expense").value) || 0,
    diger: parseFloat(document.getElementById("diger-expense").value) || 0,
    usdBirikim: parseFloat(document.getElementById("usd-birikim").value) || 0,
  };

  try {
    // Fetch ile Backend'e POST isteği atıyoruz
    const response = await fetch(`${API_URL}/budget`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      customAlert("Başarılı", "Veriler Buluta Kaydedildi! ☁️");
      calculateBudget(data);
    } else {
      customAlert("Hata", "Kaydedilemedi.");
    }
  } catch (error) {
    console.error(error);
    customAlert("Sunucu Hatası", "Backend açık mı?");
  }
}

// --- VERİ YÜKLEME (DATABASE'DEN ÇEKER) ---
async function loadData() {
  const username = localStorage.getItem("currentUsername");
  if (!username) return;

  try {
    // Backend'den verileri iste
    const response = await fetch(`${API_URL}/budget/${username}`);

    if (response.ok) {
      const data = await response.json();

      // Gelen verileri kutulara doldur
      document.getElementById("monthly-income").value = data.income;
      document.getElementById("rent-expense").value = data.rent;
      document.getElementById("rent-day").value = data.rentDay;
      document.getElementById("mutfak-expense").value = data.mutfak;
      document.getElementById("ulasim-expense").value = data.ulasim;
      document.getElementById("eglence-expense").value = data.eglence;
      document.getElementById("diger-expense").value = data.diger;
      document.getElementById("usd-birikim").value = data.usdBirikim;

      calculateBudget(data);
    }
  } catch (error) {
    console.log("Veri çekilemedi (Yeni kullanıcı olabilir).");
  }
}

// --- HESAPLAMALAR ---
function calculateBudget(data) {
  if (!data) return;

  const totalFixedExpenses =
    data.rent + data.mutfak + data.ulasim + data.eglence + data.diger;
  const availableBudget = data.income - totalFixedExpenses;

  // Günlük Limit Hesabı
  const today = new Date().getDate();
  const remainingDays = 30 - today + 1;
  const dailyLimit = availableBudget > 0 ? availableBudget / remainingDays : 0;

  document.getElementById("available-budget").textContent =
    availableBudget.toFixed(2) + " TL";
  document.getElementById("daily-limit").textContent =
    dailyLimit.toFixed(2) + " TL";

  renderBudgetChart(data, totalFixedExpenses);
}

// --- GRAFİK ---
function renderBudgetChart(data, fixedExpenses) {
  if (chartInstance) chartInstance.destroy();
  const ctx = document.getElementById("budgetChart").getContext("2d");

  const kalan = data.income - fixedExpenses;

  chartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Kira", "Mutfak", "Ulaşım", "Eğlence", "Diğer", "Kalan"],
      datasets: [
        {
          data: [
            data.rent,
            data.mutfak,
            data.ulasim,
            data.eglence,
            data.diger,
            kalan > 0 ? kalan : 0,
          ],
          backgroundColor: [
            "#FF6384",
            "#FF9F40",
            "#FFCD56",
            "#4BC0C0",
            "#9966FF",
            "#4CAF50",
          ],
        },
      ],
    },
  });
}

// --- MODAL ---
function customAlert(title, message) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalMessage").textContent = message;
  document.getElementById("customAlertModal").style.display = "block";
}
function closeModal() {
  document.getElementById("customAlertModal").style.display = "none";
}
