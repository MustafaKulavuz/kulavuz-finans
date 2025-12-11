const mongoose = require("mongoose");

const BudgetSchema = new mongoose.Schema({
  username: { type: String, required: true }, // Kullanıcı Adı
  income: { type: Number, default: 0 }, // Gelir
  rent: { type: Number, default: 0 }, // Kira
  food: { type: Number, default: 0 }, // Mutfak
  transport: { type: Number, default: 0 }, // Ulaşım
  entertainment: { type: Number, default: 0 }, // Eğlence
  other: { type: Number, default: 0 }, // Diğer
  rentDay: { type: Number, default: 1 }, // Kira Günü
  usdBirikim: { type: Number, default: 0 }, // Hedef Birikim
  updatedAt: { type: Date, default: Date.now },
});

// DÜZELTME: Model zaten varsa onu kullan, yoksa yenisini oluştur.
module.exports = mongoose.models.Budget || mongoose.model("Budget", BudgetSchema);