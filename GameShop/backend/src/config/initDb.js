// src/config/initDb.js
// Chạy 1 lần để tạo bảng: node src/config/initDb.js
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const createTables = async () => {
    console.log('🔧 Khởi tạo database GameNoob...');

    const query = `
        -- Tạo bảng games
        CREATE TABLE IF NOT EXISTS games (
            id                  SERIAL PRIMARY KEY,
            steam_appid         INT UNIQUE NOT NULL,
            name                VARCHAR(500) NOT NULL,
            short_description   TEXT DEFAULT '',
            detailed_description TEXT DEFAULT '',
            header_image        TEXT DEFAULT '',
            screenshots         JSONB DEFAULT '[]'::jsonb,
            genres              JSONB DEFAULT '[]'::jsonb,
            categories          JSONB DEFAULT '[]'::jsonb,
            price_usd           NUMERIC(10,2) DEFAULT 0,
            price_vnd           BIGINT DEFAULT 0,
            is_free             BOOLEAN DEFAULT FALSE,
            developer           VARCHAR(500) DEFAULT '',
            publisher           VARCHAR(500) DEFAULT '',
            release_date        VARCHAR(100) DEFAULT '',
            metacritic_score    INT,
            platforms           JSONB DEFAULT '{}'::jsonb,
            tags                JSONB DEFAULT '[]'::jsonb,
            owners              VARCHAR(200) DEFAULT '',
            positive_ratings    INT DEFAULT 0,
            negative_ratings    INT DEFAULT 0,
            created_at          TIMESTAMP DEFAULT NOW(),
            updated_at          TIMESTAMP DEFAULT NOW()
        );

        -- Index cho tìm kiếm full-text
        CREATE INDEX IF NOT EXISTS idx_games_search
            ON games USING gin(to_tsvector('english', name || ' ' || COALESCE(short_description, '')));

        -- Index cho lọc theo genre
        CREATE INDEX IF NOT EXISTS idx_games_genres ON games USING gin(genres);

        -- Index cho sort theo giá
        CREATE INDEX IF NOT EXISTS idx_games_price_vnd ON games(price_vnd);

        -- Index cho sort theo metacritic
        CREATE INDEX IF NOT EXISTS idx_games_metacritic ON games(metacritic_score DESC NULLS LAST);

        -- Index cho free games
        CREATE INDEX IF NOT EXISTS idx_games_is_free ON games(is_free);

        -- Index cho appid lookup
        CREATE INDEX IF NOT EXISTS idx_games_appid ON games(steam_appid);
    `;

    try {
        await pool.query(query);
        console.log('✅ Bảng "games" đã được tạo thành công!');
        console.log('');
        console.log('👉 Bước tiếp theo: chạy seeder để lấy dữ liệu từ Steam');
        console.log('   node src/scripts/seedGames.js');
        console.log('   node src/scripts/seedGames.js --pages 3   (lấy thêm 3000+ game từ SteamSpy)');
    } catch (err) {
        console.error('❌ Lỗi tạo bảng:', err.message);
        throw err;
    } finally {
        await pool.end();
    }
};

createTables().catch((err) => {
    console.error(err);
    process.exit(1);
});
