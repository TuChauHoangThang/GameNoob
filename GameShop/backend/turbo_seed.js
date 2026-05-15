const { Pool } = require('pg');
require('dotenv').config();
const axios = require('axios');

const pool = new Pool({
    user:     process.env.DB_USER,
    host:     process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port:     process.env.DB_PORT,
});

const STEAM_DELAY = 800; // Giảm xuống 800ms (cực kỳ mạo hiểm nhưng nhanh)
const CONCURRENCY = 3;   // Chạy 3 luồng song song

async function fetchAndSave(appid) {
    try {
        const res = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appid}&cc=us&l=english`, { timeout: 10000 });
        const data = res.data[appid];

        if (data && data.success && data.data.type === 'game') {
            const g = data.data;
            const releaseDateStr = g.release_date?.date || '';
            const releaseYear = parseInt(releaseDateStr.split(',').pop().trim()) || 0;

            // Lọc cực gắt: Chỉ lấy game từ 2021 trở đi
            if (releaseYear < 2021 && !g.name.includes('Resident Evil')) return;

            const priceOverview = g.price_overview;
            const priceUsd = priceOverview ? priceOverview.final / 100 : 0;
            const priceVnd = g.is_free ? 0 : Math.round(priceUsd * 26000);

            const screenshots = (g.screenshots || []).map(s => ({ id: s.id, full: s.path_full }));

            const sql = `
                INSERT INTO games (
                    steam_appid, name, short_description, detailed_description,
                    header_image, screenshots, genres, categories,
                    price_usd, price_vnd, is_free, developers, publishers,
                    release_date, metacritic_score, platforms, background, updated_at
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17, NOW())
                ON CONFLICT (steam_appid) DO UPDATE SET updated_at = NOW()
            `;

            await pool.query(sql, [
                g.steam_appid, g.name, g.short_description, g.detailed_description,
                g.header_image, JSON.stringify(screenshots), 
                JSON.stringify((g.genres || []).map(x => x.description)),
                JSON.stringify((g.categories || []).map(x => x.description)),
                priceUsd, priceVnd, g.is_free, g.developers || [], g.publishers || [],
                releaseDateStr, g.metacritic ? g.metacritic.score : null,
                JSON.stringify(g.platforms || {}), g.background
            ]);
            return g.name;
        }
    } catch (err) {
        return null;
    }
}

async function startTurboSeed() {
    console.log('🚀 KÍCH HOẠT CHẾ ĐỘ NẠP SIÊU TỐC (TURBO SEED)...');
    
    // Cập nhật RE9 và Pragmata với ảnh chuẩn trước
    const special = [
        { id: 1490890, name: 'Resident Evil 9: Requiem', img: 'https://pic.files.news/file/picsnews/2024/05/resident-evil-9-rumors-scaled.jpg' },
        { id: 1364780, name: 'Pragmata', img: 'https://cdn.akamai.steamstatic.com/steam/apps/1364780/library_hero.jpg' }
    ];
    for(let s of special) {
        await pool.query("UPDATE games SET header_image = $1, background = $1 WHERE steam_appid = $2", [s.img, s.id]);
    }

    // Lấy 2000 AppID từ SteamSpy (Action + RPG + Strategy)
    const spyRes = await axios.get('https://steamspy.com/api.php?request=top100forever');
    const appids = Object.keys(spyRes.data);
    
    const actionRes = await axios.get('https://steamspy.com/api.php?request=genre&genre=Action');
    appids.push(...Object.keys(actionRes.data).slice(0, 1000));

    const rpgRes = await axios.get('https://steamspy.com/api.php?request=genre&genre=RPG');
    appids.push(...Object.keys(rpgRes.data).slice(0, 1000));

    const uniqueAppIds = [...new Set(appids)];
    console.log(`📦 Đã thu thập ${uniqueAppIds.length} AppIDs. Bắt đầu nạp...`);

    let count = 0;
    for (let i = 0; i < uniqueAppIds.length; i += CONCURRENCY) {
        const chunk = uniqueAppIds.slice(i, i + CONCURRENCY);
        const results = await Promise.all(chunk.map(id => fetchAndSave(id)));
        const saved = results.filter(r => r !== null);
        count += saved.length;
        if (saved.length > 0) console.log(`✅ [${i}/${uniqueAppIds.length}] Đã nạp thêm: ${saved.join(', ')}`);
        
        await new Promise(r => setTimeout(r, STEAM_DELAY));
        
        // Dừng lại khi đủ 1000 hoặc hết danh sách
        if (count >= 1000) break;
    }

    console.log('🏁 Hoàn thành nạp 1000 game!');
    process.exit(0);
}

startTurboSeed();
