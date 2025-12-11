const mongoose = require("mongoose");

const BudgetSchema = new mongoose.Schema({
  username: { type: String, required: true },
  income: { type: Number, default: 0 },
  rent: { type: Number, default: 0 },
  food: { type: Number, default: 0 },
  transport: { type: Number, default: 0 },
  entertainment: { type: Number, default: 0 },
  other: { type: Number, default: 0 },
  rentDay: { type: Number, default: 1 },
  usdBirikim: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

// --- KRİTİK DÜZELTME BURADA ---
// Model zaten varsa (mongoose.models.Budget) onu kullan, yoksa yeniden oluştur.
module.exports = mongoose.models.Budget || mongoose.model("Budget", BudgetSchema);