const pool = require('../configs/db');

// Lấy tất cả game
const getAllGames = async (limit = 20, offset = 0) => {
  const result = await pool.query(
    'SELECT * FROM games ORDER BY id DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return result.rows;
};

// Lấy game theo thể loại
const getGamesByGenre = async (genre, limit = 20, offset = 0) => {
  const result = await pool.query(
    `SELECT * FROM games WHERE genres::text ILIKE $1 OR categories::text ILIKE $1 ORDER BY id DESC LIMIT $2 OFFSET $3`,
    [`%${genre}%`, limit, offset]
  );
  return result.rows;
};

// Tìm kiếm game theo tên
const searchGames = async (query, limit = 20, offset = 0) => {
  const result = await pool.query(
    'SELECT * FROM games WHERE name ILIKE $1 ORDER BY id DESC LIMIT $2 OFFSET $3',
    [`%${query}%`, limit, offset]
  );
  return result.rows;
};

// Lấy chi tiết game theo ID
const getGameById = async (id) => {
  const result = await pool.query('SELECT * FROM games WHERE id = $1', [id]);
  return result.rows[0];
};

// Lấy chi tiết game theo Steam AppID
const getGameBySteamAppId = async (steamAppId) => {
  const result = await pool.query('SELECT * FROM games WHERE steam_appid = $1', [steamAppId]);
  return result.rows[0];
};

// Thêm hoặc cập nhật game (Upsert)
const upsertGame = async (gameData) => {
  const {
    steam_appid, name, short_description, detailed_description,
    header_image, capsule_image, website, developers, publishers,
    price_overview, platforms, categories, genres, screenshots,
    movies, release_date, background, rating, owners
  } = gameData;

  const query = `
    INSERT INTO games (
      steam_appid, name, short_description, detailed_description,
      header_image, capsule_image, website, developers, publishers,
      price_overview, platforms, categories, genres, screenshots,
      movies, release_date, background, rating, owners
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
    )
    ON CONFLICT (steam_appid) DO UPDATE SET
      name = EXCLUDED.name,
      short_description = EXCLUDED.short_description,
      detailed_description = EXCLUDED.detailed_description,
      header_image = EXCLUDED.header_image,
      capsule_image = EXCLUDED.capsule_image,
      website = EXCLUDED.website,
      developers = EXCLUDED.developers,
      publishers = EXCLUDED.publishers,
      price_overview = EXCLUDED.price_overview,
      platforms = EXCLUDED.platforms,
      categories = EXCLUDED.categories,
      genres = EXCLUDED.genres,
      screenshots = EXCLUDED.screenshots,
      movies = EXCLUDED.movies,
      release_date = EXCLUDED.release_date,
      background = EXCLUDED.background,
      rating = EXCLUDED.rating,
      owners = EXCLUDED.owners
    RETURNING *;
  `;

  const values = [
    steam_appid,
    name,
    short_description,
    detailed_description,
    header_image,
    capsule_image,
    website,
    developers,
    publishers,
    JSON.stringify(price_overview),
    JSON.stringify(platforms),
    JSON.stringify(categories),
    JSON.stringify(genres),
    JSON.stringify(screenshots),
    JSON.stringify(movies),
    JSON.stringify(release_date),
    background,
    rating,
    owners
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

module.exports = {
  getAllGames,
  getGamesByGenre,
  searchGames,
  getGameById,
  getGameBySteamAppId,
  upsertGame,
};
