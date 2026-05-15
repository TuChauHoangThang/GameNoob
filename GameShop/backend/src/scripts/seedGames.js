// src/scripts/seedGames.js
// Lấy dữ liệu game từ SteamSpy + Steam Store API, lưu vào PostgreSQL
//
// Cách dùng:
//   node src/scripts/seedGames.js               → seed top 300 games (nhanh ~8 phút)
//   node src/scripts/seedGames.js --pages 3     → thêm 3 trang SteamSpy (~3000 game thêm)
//   node src/scripts/seedGames.js --resume      → tiếp tục từ lần trước nếu bị ngắt

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// ─── Config ───────────────────────────────────────────────────────────────────
const STEAM_DELAY    = parseInt(process.env.STEAM_DELAY_MS)    || 1500; // ms giữa mỗi call Steam
const STEAMSPY_DELAY = parseInt(process.env.STEAMSPY_DELAY_MS) || 1100; // ms giữa mỗi call SteamSpy
const USD_TO_VND     = 26000; // tỷ giá quy đổi

const args          = process.argv.slice(2);
const pagesArg      = args.indexOf('--pages');
const MAX_ALL_PAGES = pagesArg !== -1 ? parseInt(args[pagesArg + 1]) || 0 : 0;
const RESUME        = args.includes('--resume');
const PROGRESS_FILE = path.join(__dirname, '../../.seed_progress.json');

const pool = new Pool({
    user:     process.env.DB_USER,
    host:     process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port:     process.env.DB_PORT,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

function loadProgress() {
    if (RESUME && fs.existsSync(PROGRESS_FILE)) {
        const p = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
        console.log(`♻️  Resume mode: đã có ${p.processed.length} games processed, ${p.failed.length} failed`);
        return p;
    }
    return { processed: [], failed: [] };
}

function saveProgress(progress) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// ─── SteamSpy Fetcher ────────────────────────────────────────────────────────
async function fetchSteamSpy(request, page = null) {
    let url = `https://steamspy.com/api.php?request=${request}`;
    if (page !== null) url += `&page=${page}`;

    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            console.log(`   📡 SteamSpy [${request}${page !== null ? ` page=${page}` : ''}] attempt ${attempt}...`);
            const res = await axios.get(url, { timeout: 30000 });
            if (res.data && typeof res.data === 'object') return res.data;
        } catch (err) {
            console.warn(`   ⚠️  SteamSpy error (attempt ${attempt}): ${err.message}`);
            if (attempt < 3) await delay(5000);
        }
    }
    return {};
}

// ─── Steam Store Fetcher ─────────────────────────────────────────────────────
async function fetchSteamDetails(appid) {
    try {
        const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=us&l=english`;
        const res = await axios.get(url, { timeout: 15000 });
        const entry = res.data?.[appid];

        // Chỉ lấy game thực sự (bỏ DLC, soundtrack, demo...)
        if (!entry?.success || entry.data?.type !== 'game') return null;

        return entry.data;
    } catch {
        return null;
    }
}

// ─── Data Parser ─────────────────────────────────────────────────────────────
function parseGameData(steamData, spyData = {}) {
    const releaseDateStr = steamData.release_date?.date || '';
    const releaseYear = parseInt(releaseDateStr.split(',').pop().trim()) || 0;

    // Chỉ lấy game từ 2020 trở lên
    if (releaseYear < 2020 && !steamData.name.includes('Resident Evil')) return null;

    const priceOverview = steamData.price_overview;
    const priceUsd      = priceOverview ? priceOverview.final / 100 : 0;
    const priceVnd      = steamData.is_free ? 0 : Math.round(priceUsd * 26000);

    const screenshots = (steamData.screenshots || []).map((s) => ({
        id:        s.id,
        thumbnail: s.path_thumbnail,
        full:      s.path_full,
    }));

    const genres     = (steamData.genres || []).map((g) => g.description);
    const categories = (steamData.categories || []).map((c) => c.description);
    const tags       = spyData.tags ? Object.keys(spyData.tags).slice(0, 20) : [];

    return {
        steam_appid:          steamData.steam_appid,
        name:                 steamData.name?.substring(0, 500) || '',
        short_description:    steamData.short_description || '',
        detailed_description: (steamData.detailed_description || '').substring(0, 50000),
        header_image:         steamData.header_image || '',
        screenshots:          JSON.stringify(screenshots),
        genres:               JSON.stringify(genres),
        categories:           JSON.stringify(categories),
        price_usd:            priceUsd,
        price_vnd:            priceVnd,
        is_free:              steamData.is_free || false,
        developers:           steamData.developers || [],
        publishers:           steamData.publishers || [],
        release_date:         steamData.release_date?.date || '',
        metacritic_score:     steamData.metacritic?.score || null,
        platforms:            JSON.stringify(steamData.platforms || {}),
        tags:                 JSON.stringify(tags),
        owners:               spyData.owners || '',
        positive_ratings:     parseInt(spyData.positive) || 0,
        negative_ratings:     parseInt(spyData.negative) || 0,
    };
}

// ─── DB Insert ───────────────────────────────────────────────────────────────
async function upsertGame(g) {
    const sql = `
        INSERT INTO games (
            steam_appid, name, short_description, detailed_description,
            header_image, screenshots, genres, categories,
            price_usd, price_vnd, is_free, developers, publishers,
            release_date, metacritic_score, platforms, tags,
            owners, positive_ratings, negative_ratings, updated_at
        ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
            $11,$12,$13,$14,$15,$16,$17,$18,$19,$20, NOW()
        )
        ON CONFLICT (steam_appid) DO UPDATE SET
            name                 = EXCLUDED.name,
            short_description    = EXCLUDED.short_description,
            detailed_description = EXCLUDED.detailed_description,
            header_image         = EXCLUDED.header_image,
            screenshots          = EXCLUDED.screenshots,
            genres               = EXCLUDED.genres,
            categories           = EXCLUDED.categories,
            price_usd            = EXCLUDED.price_usd,
            price_vnd            = EXCLUDED.price_vnd,
            is_free              = EXCLUDED.is_free,
            developers           = EXCLUDED.developers,
            publishers           = EXCLUDED.publishers,
            release_date         = EXCLUDED.release_date,
            metacritic_score     = EXCLUDED.metacritic_score,
            platforms            = EXCLUDED.platforms,
            tags                 = EXCLUDED.tags,
            owners               = EXCLUDED.owners,
            positive_ratings     = EXCLUDED.positive_ratings,
            negative_ratings     = EXCLUDED.negative_ratings,
            updated_at           = NOW()
    `;
    await pool.query(sql, [
        g.steam_appid, g.name, g.short_description, g.detailed_description,
        g.header_image, g.screenshots, g.genres, g.categories,
        g.price_usd, g.price_vnd, g.is_free, g.developers, g.publishers,
        g.release_date, g.metacritic_score, g.platforms, g.tags,
        g.owners, g.positive_ratings, g.negative_ratings,
    ]);
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
    console.log('');
    console.log('🚀 ==============================');
    console.log('   GameNoob Steam Seeder v1.0');
    console.log('==============================');
    console.log(`⚙️  Steam delay: ${STEAM_DELAY}ms | SteamSpy delay: ${STEAMSPY_DELAY}ms`);
    console.log(`📄 SteamSpy "all" pages thêm: ${MAX_ALL_PAGES}`);
    console.log(`♻️  Resume mode: ${RESUME ? 'BẬT' : 'TẮT'}`);
    console.log('');

    // Kiểm tra kết nối DB
    try {
        await pool.query('SELECT 1');
        console.log('✅ Kết nối PostgreSQL thành công\n');
    } catch (err) {
        console.error('❌ Không thể kết nối PostgreSQL:', err.message);
        console.error('   → Hãy chắc chắn PostgreSQL đang chạy và DATABASE_URL đúng');
        process.exit(1);
    }

    const progress     = loadProgress();
    const processedSet = new Set(progress.processed.map(String));
    const spyDataMap   = {}; // appid -> steamspy data

    // ── Phase 1: Thu thập appids từ SteamSpy ────────────────────────────────
    console.log('📊 Phase 1: Thu thập appids từ SteamSpy...\n');

    // 3 top-lists (1 req/s, nhanh)
    const topLists = [
        { name: 'top100in2weeks', label: 'Top 100 (2 tuần)' },
        { name: 'top100forever',  label: 'Top 100 (mọi thời)' },
        { name: 'top100owned',    label: 'Top 100 (nhiều người sở hữu)' },
        { name: 'genre&genre=Action', label: 'Top Action' },
        { name: 'genre&genre=RPG',    label: 'Top RPG' },
        { name: 'genre&genre=Strategy', label: 'Top Strategy' },
    ];

    for (const list of topLists) {
        const data = await fetchSteamSpy(list.name);
        const count = Object.keys(data).length;
        Object.assign(spyDataMap, data);
        console.log(`   ✅ ${list.label}: ${count} games`);
        await delay(STEAMSPY_DELAY);
    }

    console.log(`\n   Tổng từ top-lists: ${Object.keys(spyDataMap).length} unique games`);

    // Thêm từ "all" pages (mỗi trang ~1000 game, rate limit 60s/trang)
    if (MAX_ALL_PAGES > 0) {
        console.log(`\n   📃 Đang lấy ${MAX_ALL_PAGES} trang "all" (~${MAX_ALL_PAGES * 1000} games thêm)...`);
        console.log('   ⚠️  Mỗi trang cần chờ 60 giây do SteamSpy rate limit\n');

        for (let page = 0; page < MAX_ALL_PAGES; page++) {
            if (page > 0) {
                process.stdout.write(`   ⏳ Chờ 60 giây trước trang ${page}...`);
                for (let i = 60; i > 0; i--) {
                    process.stdout.write(`\r   ⏳ Chờ ${i}s trước trang ${page}...   `);
                    await delay(1000);
                }
                process.stdout.write('\n');
            }

            const data    = await fetchSteamSpy('all', page);
            let newCount  = 0;
            Object.entries(data).forEach(([appid, info]) => {
                if (!spyDataMap[appid]) {
                    spyDataMap[appid] = info;
                    newCount++;
                }
            });

            if (Object.keys(data).length === 0) {
                console.log(`   ⚠️  Trang ${page} rỗng, dừng lại`);
                break;
            }
            console.log(`   ✅ Trang ${page}: +${newCount} games mới (tổng: ${Object.keys(spyDataMap).length})`);
            await delay(STEAMSPY_DELAY);
        }
    }

    // Lọc bỏ appids đã xử lý
    const allAppIds = Object.keys(spyDataMap)
        .filter((id) => !processedSet.has(id));
    console.log(`\n🎮 Tổng appids cần xử lý: ${allAppIds.length}`);
    console.log(`⏱️  Ước tính thời gian: ~${Math.ceil((allAppIds.length * STEAM_DELAY) / 60000)} phút\n`);

    if (allAppIds.length === 0) {
        console.log('✅ Không có gì mới để seed!');
        await pool.end();
        return;
    }

    // ── Phase 2: Fetch Steam details & lưu DB ───────────────────────────────
    console.log('🎯 Phase 2: Fetch Steam details và lưu vào DB...\n');

    let successCount = 0;
    let failCount    = 0;
    let skipCount    = 0; // không phải game (DLC, v.v.)

    const startTime = Date.now();

    for (let i = 0; i < allAppIds.length; i++) {
        const appid   = allAppIds[i];
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const eta     = i > 0 ? Math.ceil(((Date.now() - startTime) / i) * (allAppIds.length - i) / 1000) : '?';
        const pct     = ((i / allAppIds.length) * 100).toFixed(1);

        process.stdout.write(
            `\r[${pct}%] ${i + 1}/${allAppIds.length} | ✅ ${successCount} | ❌ ${failCount} | ⏭️  ${skipCount} | ⏱️  ${elapsed}s / ETA ${eta}s | appid: ${appid}    `
        );

        const steamData = await fetchSteamDetails(appid);

        if (steamData) {
            try {
                const gameData = parseGameData(steamData, spyDataMap[appid]);
                await upsertGame(gameData);
                successCount++;
                progress.processed.push(appid);
            } catch (err) {
                failCount++;
                progress.failed.push(appid);
            }
        } else {
            // Không phải game hoặc Steam block → đánh dấu là processed để skip lần sau
            skipCount++;
            progress.processed.push(appid);
        }

        // Lưu progress mỗi 20 games
        if ((i + 1) % 20 === 0) saveProgress(progress);

        await delay(STEAM_DELAY);
    }

    saveProgress(progress);

    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    console.log('\n');
    console.log('🏁 ==============================');
    console.log('   Seeding hoàn tất!');
    console.log('==============================');
    console.log(`   ✅ Thêm vào DB:  ${successCount} games`);
    console.log(`   ⏭️  Không phải game (DLC/Soundtrack): ${skipCount}`);
    console.log(`   ❌ Lỗi:          ${failCount}`);
    console.log(`   ⏱️  Tổng thời gian: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s`);
    console.log('');

    await pool.end();
}

main().catch((err) => {
    console.error('\n❌ Fatal error:', err.message);
    pool.end();
    process.exit(1);
});
