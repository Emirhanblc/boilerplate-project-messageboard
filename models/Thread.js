const mongoose = require('mongoose');

// Cevaplar (Replies) için Şema
const ReplySchema = new mongoose.Schema({
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false }
});

// Konular (Threads) için Şema
const ThreadSchema = new mongoose.Schema({
  board: { type: String, required: true },
  text: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
  delete_password: { type: String, required: true },
  replies: [ReplySchema] // Konunun içindeki cevapları bu dizide tutacağız
});

// Model olarak dışa aktar
module.exports = mongoose.model('Thread', ThreadSchema);