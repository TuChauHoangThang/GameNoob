require('dotenv').config();
const axios = require('axios');
const gameModel = require('./models/gameModel');

const SLEEP_TIME = 1500; // 1.5 seconds between requests to avoid rate limit

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function seedGames() {
  try {
    console.log('--- Bắt đầu lấy dữ liệu từ Steam Spy ---');
    // Lấy top 100 game trong 2 tuần qua từ Steam Spy
    const response = await axios.get('https://steamspy.com/api.php?request=top100in2weeks');
    const gamesList = Object.values(response.data);
    
    // Chỉ lấy 30 game đầu tiên để tránh bị block IP do request quá nhiều
    const topGames = gamesList.slice(0, 30);
    console.log(`Đã lấy danh sách ${topGames.length} game. Đang lấy chi tiết từng game...`);

    for (const gameInfo of topGames) {
      const appid = gameInfo.appid;
      console.log(`Đang lấy chi tiết cho AppID: ${appid} - ${gameInfo.name}...`);

      try {
        const detailResponse = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appid}&l=vietnamese`);
        const data = detailResponse.data[appid];

        if (data.success) {
          const gameData = data.data;
          
          const formattedGame = {
            steam_appid: gameData.steam_appid,
            name: gameData.name,
            short_description: gameData.short_description,
            detailed_description: gameData.detailed_description,
            header_image: gameData.header_image,
            capsule_image: gameData.capsule_image_v5 || gameData.header_image,
            website: gameData.website,
            developers: gameData.developers || [],
            publishers: gameData.publishers || [],
            price_overview: gameData.price_overview || { 
              currency: 'VND', 
              initial: 0, 
              final: 0, 
              discount_percent: 0,
              final_formatted: 'Miễn phí'
            },
            platforms: gameData.platforms,
            categories: gameData.categories,
            genres: gameData.genres,
            screenshots: gameData.screenshots,
            movies: gameData.movies,
            release_date: gameData.release_date,
            background: gameData.background,
            rating: (gameInfo.positive / (gameInfo.positive + gameInfo.negative)) * 100 || 0,
            owners: gameInfo.owners
          };

          await gameModel.upsertGame(formattedGame);
          console.log(`✅ Đã lưu/cập nhật: ${gameData.name}`);
        } else {
          console.log(`❌ Không thể lấy chi tiết cho AppID: ${appid}`);
        }
      } catch (error) {
        console.error(`Lỗi khi lấy chi tiết game ${appid}:`, error.message);
      }

      // Nghỉ một chút để tránh rate limit
      await sleep(SLEEP_TIME);
    }

    console.log('--- Hoàn tất quá trình seed dữ liệu game! ---');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi trong quá trình seed:', error);
    process.exit(1);
  }
}

seedGames();
