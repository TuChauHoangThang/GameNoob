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

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function fetchAndSave(appid) {
    try {
        console.log(`📡 Fetching details for modern game AppID: ${appid}...`);
        const res = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appid}&cc=us&l=english`);
        const data = res.data[appid];

        if (data && data.success && data.data.type === 'game') {
            const g = data.data;
            const priceOverview = g.price_overview;
            const priceUsd = priceOverview ? priceOverview.final / 100 : 0;
            const priceVnd = g.is_free ? 0 : Math.round(priceUsd * 26000);

            const screenshots = (g.screenshots || []).map(s => ({
                id: s.id,
                thumbnail: s.path_thumbnail,
                full: s.path_full
            }));

            const sql = `
                INSERT INTO games (
                    steam_appid, name, short_description, detailed_description,
                    header_image, screenshots, genres, categories,
                    price_usd, price_vnd, is_free, developers, publishers,
                    release_date, metacritic_score, platforms, background, updated_at
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17, NOW())
                ON CONFLICT (steam_appid) DO UPDATE SET
                    name = EXCLUDED.name,
                    short_description = EXCLUDED.short_description,
                    detailed_description = EXCLUDED.detailed_description,
                    header_image = EXCLUDED.header_image,
                    screenshots = EXCLUDED.screenshots,
                    genres = EXCLUDED.genres,
                    categories = EXCLUDED.categories,
                    price_usd = EXCLUDED.price_usd,
                    price_vnd = EXCLUDED.price_vnd,
                    is_free = EXCLUDED.is_free,
                    developers = EXCLUDED.developers,
                    publishers = EXCLUDED.publishers,
                    release_date = EXCLUDED.release_date,
                    metacritic_score = EXCLUDED.metacritic_score,
                    platforms = EXCLUDED.platforms,
                    background = EXCLUDED.background,
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
            console.log(`✅ Saved: ${g.name}`);
        }
    } catch (err) {
        console.error(`❌ Error fetching ${appid}:`, err.message);
    }
}

async function seedModernGames() {
    const modernAppIds = [
        1196590, 2050650, 418370, 883710, 952060, 339340, 304240, 21690, 221040, // Resident Evil series
        1364780, // Pragmata
        1548190, // Black Myth Wukong
        1245620, // Elden Ring
        2321470, // Ghost of Tsushima
        1774580, // Star Wars Jedi Survivor
        1888140, // S.T.A.L.K.E.R. 2
        1086940, // Baldur's Gate 3
        1233550, // Final Fantasy VII Rebirth (if on steam)
        1615110, // Dragon's Dogma 2
        1203220, // NARAKA: BLADEPOINT
    ];

    console.log('🚀 Seeding modern AAA games for a 2026 look...');
    for (const id of modernAppIds) {
        await fetchAndSave(id);
        await delay(1500);
    }
    console.log('🏁 Done!');
    process.exit(0);
}

seedModernGames();
