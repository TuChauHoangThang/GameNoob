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

const STEAM_DELAY = 600; // Cực nhanh, mạo hiểm
const CONCURRENCY = 5;   // 5 luồng song song để đạt 1000 game nhanh nhất

async function fetchAndSave(appid) {
    try {
        const res = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appid}&cc=vn&l=vietnamese`, { timeout: 8000 });
        const data = res.data[appid];

        if (data && data.success && data.data.type === 'game') {
            const g = data.data;
            
            // Lấy giá VND trực tiếp từ Steam VN
            const priceOverview = g.price_overview;
            const priceVnd = g.is_free ? 0 : (priceOverview ? priceOverview.final : 0);
            const priceUsd = Math.round(priceVnd / 25000);

            const screenshots = (g.screenshots || []).map(s => ({ id: s.id, full: s.path_full }));

            const sql = `
                INSERT INTO games (
                    steam_appid, name, short_description, detailed_description,
                    header_image, screenshots, genres, categories,
                    price_usd, price_vnd, is_free, developers, publishers,
                    release_date, metacritic_score, platforms, background, updated_at
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17, NOW())
                ON CONFLICT (steam_appid) DO UPDATE SET 
                    name = EXCLUDED.name,
                    price_vnd = EXCLUDED.price_vnd,
                    updated_at = NOW()
            `;

            await pool.query(sql, [
                g.steam_appid, g.name, g.short_description, g.detailed_description,
                g.header_image, JSON.stringify(screenshots), 
                JSON.stringify((g.genres || []).map(x => x.description)),
                JSON.stringify((g.categories || []).map(x => x.description)),
                priceUsd, priceVnd, g.is_free, g.developers || [], g.publishers || [],
                g.release_date ? g.release_date.date : '', g.metacritic ? g.metacritic.score : null,
                JSON.stringify(g.platforms || {}), g.background
            ]);
            return g.name;
        }
    } catch (err) {
        return null;
    }
}

async function massiveSeed() {
    console.log('🚀 KHỞI ĐỘNG CHIẾN DỊCH NẠP 1000 GAME...');
    
    let allAppIds = [];
    
    // Quét 3 trang đầu tiên của SteamSpy (3000 game)
    for(let p = 0; p <= 2; p++) {
        console.log(`📡 Lấy AppID từ SteamSpy trang ${p}...`);
        try {
            const res = await axios.get(`https://steamspy.com/api.php?request=all&page=${p}`);
            allAppIds.push(...Object.keys(res.data));
        } catch(e) { console.error(`Lỗi trang ${p}`); }
    }

    const uniqueAppIds = [...new Set(allAppIds)];
    console.log(`📦 Tổng cộng có ${uniqueAppIds.length} game tiềm năng. Bắt đầu nạp siêu tốc...`);

    let count = 0;
    for (let i = 0; i < uniqueAppIds.length; i += CONCURRENCY) {
        const chunk = uniqueAppIds.slice(i, i + CONCURRENCY);
        const results = await Promise.all(chunk.map(id => fetchAndSave(id)));
        const saved = results.filter(r => r !== null);
        count += saved.length;
        
        if (saved.length > 0) {
            console.log(`✅ [${i}/${uniqueAppIds.length}] Đã nạp: ${saved.length} game. Tổng: ${count}`);
        }
        
        await new Promise(r => setTimeout(r, STEAM_DELAY));
        if (count >= 1000) break;
    }

    console.log('🏁 CHIẾN DỊCH HOÀN TẤT!');
    process.exit(0);
}

massiveSeed();
