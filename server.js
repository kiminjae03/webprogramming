const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const axios = require('axios');
const cheerio = require('cheerio');
const fs1 = require('fs');

async function fetchMelonChart() {
  try {
    const response = await axios.get('https://www.melon.com/chart/index.htm', {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://www.melon.com/'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const songs = [];

    // 각 노래 정보를 담고 있는 wrap 요소 순회
    $('div.wrap_song_info').each((i, elem) => {
      if(Math.round((i + 1)/2 >= 10)) return false;
      const title = $(elem).find('div.ellipsis.rank01 a').text().trim();
      const artist = $(elem).find('div.ellipsis.rank02 a').first().text().trim();

      if (title && artist) {
        songs.push({
          id: String(Math.round((i + 1)/2)),
          title,
          artist
        });
      }
    });

    fs1.writeFileSync('songs.json', JSON.stringify({ songs }, null, 2));
    console.log('✅ 멜론 인기곡을 songs.json에 저장했습니다!');
  } catch (err) {
    console.error('❌ 크롤링 실패:', err.message);
  }
}

fetchMelonChart();

const fs = require('fs');
const path = require('path');

// JSON 파일 경로
const filePath = path.join(__dirname, 'songs.json');

// JSON 파일 읽기
let rawData = fs.readFileSync(filePath);
let songData = JSON.parse(rawData);

// songs 배열로 변환
let songs = songData.songs.map(song => ({
  title: `${song.title}`,
  artist: `${song.artist}`,
  score: 0,
  reasons: []
}));

io.on('connection', (socket) => {
  socket.emit('scoreUpdate', songs);

  socket.on('vote', ({ index }) => {
    songs[index].score += 1;
    io.emit('scoreUpdate', songs);
  });

  socket.on('comment', ({ index, reason }) => {
    if (reason && reason.trim() !== '') {
      songs[index].reasons.push(reason.trim());
    }
    io.emit('scoreUpdate', songs);
  });
});

http.listen(3000, () => {
  console.log('✅ 서버 실행 중! http://localhost:3000');
});
