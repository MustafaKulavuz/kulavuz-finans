const mongoose = require("mongoose");

const BudgetSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Kullanıcı adı ile verileri eşleştireceğiz
  income: { type: Number, default: 0 },
  rent: { type: Number, default: 0 },
  rentDay: { type: Number, default: 1 },
  mutfak: { type: Number, default: 0 },
  ulasim: { type: Number, default: 0 },
  eglence: { type: Number, default: 0 },
  diger: { type: Number, default: 0 },
  usdBirikim: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Budget", BudgetSchema);
