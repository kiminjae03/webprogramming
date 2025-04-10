const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let songs = [
  { title: 'TOO BAD - G-DRAGON', score: 0, reasons: [] },
  { title: '모르시나요 - 조째즈', score: 0, reasons: [] },
  { title: 'like JENNIE - 제니', score: 0, reasons: [] }
];

io.on('connection', (socket) => {
  socket.emit('scoreUpdate', songs);

  socket.on('vote', ({ index, reason }) => {
    songs[index].score += 1;
    if (reason && reason.trim() !== '') {
      songs[index].reasons.push(reason.trim());
    }
    io.emit('scoreUpdate', songs);
  });
});

http.listen(3000, () => {
  console.log('✅ 서버 실행 중! http://localhost:3000');
});
