const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user:     process.env.DB_USER,
    host:     process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port:     process.env.DB_PORT,
});

async function seedManualAAA() {
    const aaa = [
        {
            appid: 999001,
            name: 'Grand Theft Auto VI',
            desc: 'Grand Theft Auto VI đưa người chơi trở lại Vice City với quy mô và độ chi tiết chưa từng có.',
            img: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/271590/header.jpg', // Placeholder but realistic
            price: 1800000,
            date: 'Fall 2025',
            genres: ['Action', 'Open World', 'Crime'],
            rating: 99
        },
        {
            appid: 999002,
            name: 'Death Stranding 2: On The Beach',
            desc: 'Hideo Kojima trở lại với chương tiếp theo của hành trình kết nối nhân loại.',
            img: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1190460/header.jpg',
            price: 1500000,
            date: '2025',
            genres: ['Action', 'Adventure', 'Atmospheric'],
            rating: 96
        },
        {
            appid: 999003,
            name: 'Civilization VII',
            desc: 'Trở thành người dẫn đầu vĩ đại nhất thế giới trong phiên bản mới nhất của dòng game chiến thuật huyền thoại.',
            img: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/289070/header.jpg',
            price: 1200000,
            date: 'Feb 11, 2025',
            genres: ['Strategy', '4X', 'Turn-Based'],
            rating: 94
        }
    ];

    console.log('🌟 Nạp thêm bom tấn 2025...');
    for (const g of aaa) {
        const sql = `
            INSERT INTO games (
                steam_appid, name, short_description, detailed_description,
                header_image, background, price_vnd, is_free, developers, publishers,
                genres, categories, release_date, rating, platforms, updated_at
            ) VALUES ($1,$2,$3,$3,$4,$4,$5,false,$6,$6,$7,$8,$9,$10,$11, NOW())
            ON CONFLICT (steam_appid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
        `;
        await pool.query(sql, [
            g.appid, g.name, g.desc, g.img, g.price, ['Rockstar/Kojima/2K'], 
            JSON.stringify(g.genres), JSON.stringify(['Single-player']), g.date, g.rating, 
            JSON.stringify({windows: true})
        ]);
    }
    console.log('✅ Xong!');
    await pool.end();
}

seedManualAAA();
