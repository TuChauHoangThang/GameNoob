const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user:     process.env.DB_USER,
    host:     process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port:     process.env.DB_PORT,
});

async function seedSpecialGames() {
    const specialGames = [
        {
            steam_appid: 1490890, // Dự đoán/Giả lập cho RE9
            name: 'Resident Evil 9: Requiem',
            short_description: 'Chương cuối cùng của sử thi kinh dị. Đối mặt với nỗi sợ hãi nguyên thủy nhất trong một thế giới mở đầy ám ảnh.',
            detailed_description: '<h1>Resident Evil 9: Requiem</h1><p>Được phát triển trên RE Engine thế hệ mới, Requiem mang đến trải nghiệm kinh dị sinh tồn chưa từng có. Người chơi sẽ được đưa đến một hòn đảo bị cô lập, nơi những thí nghiệm sinh học cổ xưa đã tạo ra những thực thể đáng sợ nhất trong lịch sử series.</p><ul><li>Đồ họa Photorealistic 8K</li><li>Thế giới mở hoàn toàn không có loading screen</li><li>Cơ chế chiến đấu và sinh tồn được làm mới hoàn toàn</li></ul>',
            header_image: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1196590/header.jpg', // Dùng tạm ảnh RE8 làm gốc nhưng sẽ nổi bật
            background: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1196590/library_hero.jpg',
            price_vnd: 1290000,
            is_free: false,
            developers: ['CAPCOM Co., Ltd.'],
            publishers: ['CAPCOM Co., Ltd.'],
            genres: ['Action', 'Horror', 'Survival'],
            categories: ['Single-player', 'Full controller support'],
            release_date: 'Jan 24, 2026',
            rating: 98,
            platforms: { windows: true, mac: false, linux: false }
        },
        {
            steam_appid: 1364780,
            name: 'Pragmata',
            short_description: 'Cuộc phiêu lưu khoa học viễn tưởng đầy bí ẩn trên mặt trăng. Khám phá tương lai gần của nhân loại.',
            detailed_description: '<h1>Pragmata</h1><p>Một tác phẩm hoàn toàn mới từ Capcom, Pragmata đưa bạn vào một thế giới khoa học viễn tưởng loạn lạc. Với sự đồng hành của cô bé bí ẩn, bạn phải tìm cách sống sót và tìm đường trở về Trái đất từ mặt trăng.</p>',
            header_image: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1364780/header.jpg',
            background: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1364780/library_hero.jpg',
            price_vnd: 1090000,
            is_free: false,
            developers: ['CAPCOM Co., Ltd.'],
            publishers: ['CAPCOM Co., Ltd.'],
            genres: ['Adventure', 'Sci-Fi', 'Action'],
            categories: ['Single-player', 'Steam Achievements'],
            release_date: 'Coming 2026',
            rating: 95,
            platforms: { windows: true, mac: false, linux: true }
        }
    ];

    console.log('🌟 Nạp siêu phẩm RE9 và Pragmata...');
    for (const g of specialGames) {
        const sql = `
            INSERT INTO games (
                steam_appid, name, short_description, detailed_description,
                header_image, background, price_vnd, is_free, developers, publishers,
                genres, categories, release_date, rating, platforms, updated_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, NOW())
            ON CONFLICT (steam_appid) DO UPDATE SET
                name = EXCLUDED.name,
                short_description = EXCLUDED.short_description,
                detailed_description = EXCLUDED.detailed_description,
                header_image = EXCLUDED.header_image,
                background = EXCLUDED.background,
                price_vnd = EXCLUDED.price_vnd,
                is_free = EXCLUDED.is_free,
                release_date = EXCLUDED.release_date,
                rating = EXCLUDED.rating,
                updated_at = NOW()
        `;
        await pool.query(sql, [
            g.steam_appid, g.name, g.short_description, g.detailed_description,
            g.header_image, g.background, g.price_vnd, g.is_free, g.developers, g.publishers,
            JSON.stringify(g.genres), JSON.stringify(g.categories), g.release_date, g.rating,
            JSON.stringify(g.platforms)
        ]);
        console.log(`✅ Đã nạp: ${g.name}`);
    }
    await pool.end();
}

seedSpecialGames();
