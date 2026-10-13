'use strict';
const Thread = require('../models/Thread');

module.exports = function (app) {

  // ==========================================
  // KONULAR (THREADS) ROTASI: /api/threads/:board
  // ==========================================
  app.route('/api/threads/:board')
    
    // 1. Yeni Konu Açma (POST)
    .post(async (req, res) => {
      try {
        const board = req.params.board;
        const { text, delete_password } = req.body;
        
        // Zaman objesini bir değişkene atayarak iki alanın da birebir aynı milisaniyede olmasını garantiliyoruz
        const currentDate = new Date(); 

        const newThread = new Thread({
          board: board,
          text: text,
          delete_password: delete_password,
          created_on: currentDate, // Elle zaman ataması
          bumped_on: currentDate,  // Elle zaman ataması
          reported: false,
          replies: []
        });
        
        const savedThread = await newThread.save();
        res.json(savedThread);
      } catch (err) {
        res.status(500).send('Server Error');
      }
    })
    
    // 2. Konuları Listeleme (GET)
    .get(async (req, res) => {
      try {
        const board = req.params.board;
        // Sadece bu panodaki, en son güncellenen 10 konuyu getir
        let threads = await Thread.find({ board: board })
          .sort({ bumped_on: -1 })
          .limit(10)
          .lean(); // Düzenleyebilmek için lean() kullanıyoruz

        threads.forEach(thread => {
          // Cevap sayısını ekle, sadece son 3 cevabı göster
          thread.replycount = thread.replies.length;
          thread.replies = thread.replies.slice(-3);
          
          // Gizlilik gereği şifre ve report durumunu sil
          delete thread.delete_password;
          delete thread.reported;
          
          thread.replies.forEach(reply => {
            delete reply.delete_password;
            delete reply.reported;
          });
        });

        res.json(threads);
      } catch (err) {
        res.status(500).send('Server Error');
      }
    })
    
    // 3. Konu Şikayet Etme (PUT)
    .put(async (req, res) => {
      try {
        const { thread_id } = req.body;
        const thread = await Thread.findById(thread_id);
        if (!thread) return res.send('Thread not found');
        
        thread.reported = true;
        await thread.save();
        res.send('reported');
      } catch (err) {
        res.status(500).send('Server Error');
      }
    })
    
    // 4. Konu Silme (DELETE)
    .delete(async (req, res) => {
      try {
        const { thread_id, delete_password } = req.body;
        const thread = await Thread.findById(thread_id);
        if (!thread) return res.send('Thread not found');
        
        if (thread.delete_password === delete_password) {
          await Thread.findByIdAndDelete(thread_id);
          res.send('success');
        } else {
          res.send('incorrect password');
        }
      } catch (err) {
        res.status(500).send('Server Error');
      }
    });


  // ==========================================
  // CEVAPLAR (REPLIES) ROTASI: /api/replies/:board
  // ==========================================
  app.route('/api/replies/:board')
    
    // 1. Cevap Yazma (POST)
    .post(async (req, res) => {
      try {
        const { thread_id, text, delete_password } = req.body;
        const thread = await Thread.findById(thread_id);
        if (!thread) return res.send('Thread not found');
        
        const currentDate = new Date();

        const newReply = {
          text: text,
          delete_password: delete_password,
          created_on: currentDate,
          reported: false
        };
        
        thread.bumped_on = currentDate; // Konuyu yukarı taşı
        thread.replies.push(newReply);
        
        await thread.save();
        res.json(thread);
      } catch (err) {
        res.status(500).send('Server Error');
      }
    })
    
    // 2. Bir Konuyu Tüm Cevaplarıyla Getirme (GET)
    .get(async (req, res) => {
      try {
        const { thread_id } = req.query;
        let thread = await Thread.findById(thread_id).lean();
        if (!thread) return res.send('Thread not found');
        
        // Gizlilik kuralları: Şifreleri ve report alanlarını gizle
        delete thread.delete_password;
        delete thread.reported;
        
        thread.replies.forEach(reply => {
          delete reply.delete_password;
          delete reply.reported;
        });
        
        res.json(thread);
      } catch (err) {
        res.status(500).send('Server Error');
      }
    })
    
    // 3. Cevap Şikayet Etme (PUT)
    .put(async (req, res) => {
      try {
        const { thread_id, reply_id } = req.body;
        const thread = await Thread.findById(thread_id);
        if (!thread) return res.send('Thread not found');
        
        const reply = thread.replies.id(reply_id);
        if (!reply) return res.send('Reply not found');
        
        reply.reported = true;
        await thread.save();
        res.send('reported');
      } catch (err) {
        res.status(500).send('Server Error');
      }
    })
    
    // 4. Cevap Silme (DELETE)
    .delete(async (req, res) => {
      try {
        const { thread_id, reply_id, delete_password } = req.body;
        const thread = await Thread.findById(thread_id);
        if (!thread) return res.send('Thread not found');
        
        const reply = thread.replies.id(reply_id);
        if (!reply) return res.send('Reply not found');
        
        if (reply.delete_password === delete_password) {
          reply.text = '[deleted]'; // Dokümantasyon gereği tamamen silinmez, metin değiştirilir
          await thread.save();
          res.send('success');
        } else {
          res.send('incorrect password');
        }
      } catch (err) {
        res.status(500).send('Server Error');
      }
    });

};