// src/repositories/gameRepository.js
// Tương đương JpaRepository trong Spring Boot
// Chỉ chứa các SQL query thuần túy, không có business logic

const pool = require('../config/db');

// ─── Mapping sort key → SQL ORDER BY ─────────────────────────────────────────
const SORT_MAP = {
    popular:    `(positive_ratings + negative_ratings) DESC`,
    price_asc:  `price_vnd ASC`,
    price_desc: `price_vnd DESC`,
    newest:     `id DESC`,
    rating: `
        CASE WHEN (positive_ratings + negative_ratings) = 0 THEN 0
             ELSE positive_ratings::float / (positive_ratings + negative_ratings)
        END DESC, positive_ratings DESC
    `,
    metacritic: `metacritic_score DESC NULLS LAST, positive_ratings DESC`,
};

class GameRepository {

    // ── findAll – danh sách có filter + phân trang ────────────────────────────
    async findAll({ limit = 20, offset = 0, genre = null, free = null, platform = null, sort = 'popular' }) {
        const conditions = [];
        const params     = [];
        let   idx        = 1;

        if (genre) {
            conditions.push(`genres @> $${idx}::jsonb`);
            params.push(JSON.stringify([genre]));
            idx++;
        }

        if (free === true)  { conditions.push(`is_free = TRUE`);  }
        if (free === false) { conditions.push(`is_free = FALSE`); }

        if (platform) {
            conditions.push(`(platforms->$${idx})::boolean = TRUE`);
            params.push(platform);
            idx++;
        }

        const WHERE  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const ORDER  = SORT_MAP[sort] || SORT_MAP.popular;

        // Count
        const countSql = `SELECT COUNT(*) FROM games ${WHERE}`;
        const { rows: countRows } = await pool.query(countSql, params);
        const total = parseInt(countRows[0].count);

        // Data – chỉ lấy các field cần thiết cho list (không lấy detailed_description nặng)
        const dataSql = `
            SELECT
                id, steam_appid, name, short_description,
                header_image, screenshots, genres, categories,
                price_usd, price_vnd, is_free,
                developer, publisher, release_date,
                metacritic_score, platforms, tags,
                owners, positive_ratings, negative_ratings
            FROM games
            ${WHERE}
            ORDER BY ${ORDER}
            LIMIT $${idx} OFFSET $${idx + 1}
        `;
        params.push(limit, offset);

        const { rows } = await pool.query(dataSql, params);
        return { rows, total };
    }

    // ── findById – 1 game theo steam_appid ───────────────────────────────────
    async findById(steamAppid) {
        const sql    = `SELECT * FROM games WHERE steam_appid = $1 LIMIT 1`;
        const { rows } = await pool.query(sql, [steamAppid]);
        return rows[0] || null;
    }

    // ── findRelated – game liên quan cùng genre ───────────────────────────────
    async findRelated(steamAppid, genres, limit = 8) {
        if (!genres || genres.length === 0) return [];

        const sql = `
            SELECT
                id, steam_appid, name, header_image,
                price_vnd, is_free, genres,
                positive_ratings, negative_ratings, metacritic_score
            FROM games
            WHERE genres @> $1::jsonb
              AND steam_appid != $2
            ORDER BY positive_ratings DESC
            LIMIT $3
        `;
        const { rows } = await pool.query(sql, [JSON.stringify([genres[0]]), steamAppid, limit]);
        return rows;
    }

    // ── findFeatured – top games nổi bật ─────────────────────────────────────
    async findFeatured(limit = 12) {
        const sql = `
            SELECT
                id, steam_appid, name, short_description,
                header_image, screenshots, genres,
                price_usd, price_vnd, is_free,
                developer, metacritic_score,
                positive_ratings, negative_ratings
            FROM games
            WHERE positive_ratings > 500
            ORDER BY
                CASE WHEN (positive_ratings + negative_ratings) = 0 THEN 0
                     ELSE positive_ratings::float / (positive_ratings + negative_ratings)
                END DESC,
                positive_ratings DESC
            LIMIT $1
        `;
        const { rows } = await pool.query(sql, [limit]);
        return rows;
    }

    // ── search – tìm kiếm theo tên ────────────────────────────────────────────
    async search(query, { limit = 20, offset = 0 } = {}) {
        const term = `%${query}%`;

        const countSql = `SELECT COUNT(*) FROM games WHERE name ILIKE $1`;
        const total    = parseInt((await pool.query(countSql, [term])).rows[0].count);

        const dataSql = `
            SELECT
                id, steam_appid, name, short_description,
                header_image, genres, price_usd, price_vnd,
                is_free, developer, metacritic_score,
                positive_ratings, negative_ratings
            FROM games
            WHERE name ILIKE $1
            ORDER BY
                CASE WHEN name ILIKE $2 THEN 0 ELSE 1 END,
                positive_ratings DESC
            LIMIT $3 OFFSET $4
        `;
        const { rows } = await pool.query(dataSql, [term, `${query}%`, limit, offset]);
        return { rows, total };
    }

    // ── findAllGenres – danh sách thể loại ───────────────────────────────────
    async findAllGenres() {
        const sql = `
            SELECT
                jsonb_array_elements_text(genres) AS genre,
                COUNT(*)                          AS count
            FROM games
            WHERE jsonb_array_length(genres) > 0
            GROUP BY genre
            ORDER BY count DESC
        `;
        const { rows } = await pool.query(sql);
        return rows;
    }

    // ── getStats – thống kê tổng quan ────────────────────────────────────────
    async getStats() {
        const sql = `
            SELECT
                COUNT(*)                                               AS total_games,
                COUNT(*) FILTER (WHERE is_free)                       AS free_games,
                COUNT(*) FILTER (WHERE NOT is_free)                   AS paid_games,
                ROUND(AVG(price_vnd) FILTER (WHERE NOT is_free))      AS avg_price_vnd,
                MAX(price_vnd)                                         AS max_price_vnd,
                COUNT(*) FILTER (WHERE metacritic_score IS NOT NULL)  AS has_metacritic,
                COUNT(*) FILTER (WHERE metacritic_score >= 90)        AS masterpiece_count,
                SUM(positive_ratings + negative_ratings)              AS total_reviews
            FROM games
        `;
        const { rows } = await pool.query(sql);
        return rows[0];
    }

    // ── upsert – thêm hoặc cập nhật game (dùng trong seeder) ─────────────────
    async upsert(g) {
        const sql = `
            INSERT INTO games (
                steam_appid, name, short_description, detailed_description,
                header_image, screenshots, genres, categories,
                price_usd, price_vnd, is_free, developer, publisher,
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
                developer            = EXCLUDED.developer,
                publisher            = EXCLUDED.publisher,
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
            g.steam_appid,    g.name,               g.short_description,  g.detailed_description,
            g.header_image,   g.screenshots,         g.genres,             g.categories,
            g.price_usd,      g.price_vnd,           g.is_free,            g.developer,
            g.publisher,      g.release_date,        g.metacritic_score,   g.platforms,
            g.tags,           g.owners,              g.positive_ratings,   g.negative_ratings,
        ]);
    }
}

// Singleton – giống @Repository bean trong Spring
module.exports = new GameRepository();
