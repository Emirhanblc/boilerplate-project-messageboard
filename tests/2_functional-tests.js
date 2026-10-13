const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let thread_id;
let reply_id;
const testBoard = 'fcc_test_board';

suite('Functional Tests', function() {
  // Bulut ağ gecikmeleri için zaman aşımını 10 saniyeye çıkarıyoruz
  this.timeout(10000);

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    test('1. Creating a new thread: POST request to /api/threads/{board}', function(done) {
      chai.request(server)
        .post('/api/threads/' + testBoard)
        .send({
          text: 'Test thread text',
          delete_password: 'thread_password'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          thread_id = res.body._id; // Oluşan konunun ID'sini sonraki testler için kaydet
          assert.isNotNull(thread_id);
          done();
        });
    });
    
    test('2. Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
      chai.request(server)
        .get('/api/threads/' + testBoard)
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.isAtMost(res.body.length, 10);
          if (res.body[0]) {
            assert.isAtMost(res.body[0].replies.length, 3);
            assert.isUndefined(res.body[0].delete_password); // Şifre gizli mi kontrolü
            assert.isUndefined(res.body[0].reported);        // Şikayet gizli mi kontrolü
          }
          done();
        });
    });
    
    test('3. Deleting a thread with the incorrect password: DELETE request to /api/threads/{board}', function(done) {
      chai.request(server)
        .delete('/api/threads/' + testBoard)
        .send({
          thread_id: thread_id,
          delete_password: 'wrong_password'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('4. Reporting a thread: PUT request to /api/threads/{board}', function(done) {
      chai.request(server)
        .put('/api/threads/' + testBoard)
        .send({ thread_id: thread_id })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });
  });

  suite('API ROUTING FOR /api/replies/:board', function() {
    
    test('5. Creating a new reply: POST request to /api/replies/{board}', function(done) {
      chai.request(server)
        .post('/api/replies/' + testBoard)
        .send({
          thread_id: thread_id,
          text: 'Test reply text',
          delete_password: 'reply_password'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          reply_id = res.body.replies[res.body.replies.length - 1]._id; // Cevap ID'sini kaydet
          assert.isNotNull(reply_id);
          done();
        });
    });
    
    test('6. Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
      chai.request(server)
        .get('/api/replies/' + testBoard)
        .query({ thread_id: thread_id })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body._id, thread_id);
          assert.isArray(res.body.replies);
          assert.isUndefined(res.body.delete_password);
          assert.isUndefined(res.body.reported);
          done();
        });
    });
    
    test('7. Deleting a reply with the incorrect password: DELETE request to /api/replies/{board}', function(done) {
      chai.request(server)
        .delete('/api/replies/' + testBoard)
        .send({
          thread_id: thread_id,
          reply_id: reply_id,
          delete_password: 'wrong_password'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('8. Reporting a reply: PUT request to /api/replies/{board}', function(done) {
      chai.request(server)
        .put('/api/replies/' + testBoard)
        .send({
          thread_id: thread_id,
          reply_id: reply_id
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });

    test('9. Deleting a reply with the correct password: DELETE request to /api/replies/{board}', function(done) {
      chai.request(server)
        .delete('/api/replies/' + testBoard)
        .send({
          thread_id: thread_id,
          reply_id: reply_id,
          delete_password: 'reply_password'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });
  });

  suite('Final Cleanup', function() {
    test('10. Deleting a thread with the correct password: DELETE request to /api/threads/{board}', function(done) {
      chai.request(server)
        .delete('/api/threads/' + testBoard)
        .send({
          thread_id: thread_id,
          delete_password: 'thread_password'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });
  });

});