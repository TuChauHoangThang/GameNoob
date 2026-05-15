// src/services/gameService.js
// Tương đương @Service trong Spring Boot
// Chứa business logic, thao tác dữ liệu qua Repository, trả về Model cho Controller

const gameRepository = require('../repositories/gameRepository');
const Game = require('../models/Game');

class GameService {

    // Lấy danh sách games, đóng gói vào pagination object
    async getGames(params) {
        const { rows, total } = await gameRepository.findAll(params);
        const limit = params.limit || 20;

        return {
            data: Game.fromRows(rows).map(g => g.toSummary()),
            pagination: {
                page: params.page || 1,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        };
    }

    // Lấy chi tiết 1 game kèm các game liên quan
    async getGameById(steamAppid) {
        const row = await gameRepository.findById(steamAppid);
        if (!row) return null;

        const game = Game.fromRow(row);
        const relatedRows = await gameRepository.findRelated(steamAppid, game.genres, 8);

        return {
            game: game.toDetail(),
            related: Game.fromRows(relatedRows).map(g => g.toSummary())
        };
    }

    // Lấy top game nổi bật
    async getFeaturedGames(limit = 12) {
        const rows = await gameRepository.findFeatured(limit);
        return Game.fromRows(rows).map(g => g.toSummary());
    }

    // Tìm kiếm game
    async searchGames(query, params) {
        if (!query || query.trim() === '') {
            return {
                data: [],
                pagination: { page: params.page || 1, limit: params.limit || 20, total: 0, totalPages: 0 }
            };
        }

        const { rows, total } = await gameRepository.search(query.trim(), params);
        const limit = params.limit || 20;

        return {
            data: Game.fromRows(rows).map(g => g.toSummary()),
            pagination: {
                page: params.page || 1,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        };
    }

    // Lấy danh sách thể loại
    async getGenres() {
        return await gameRepository.findAllGenres();
    }

    // Lấy thống kê
    async getStats() {
        return await gameRepository.getStats();
    }
}

// Singleton service
module.exports = new GameService();
