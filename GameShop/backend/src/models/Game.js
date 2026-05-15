// src/models/Game.js
// Tương đương @Entity trong Spring Boot
// Đại diện cho cấu trúc dữ liệu game trong hệ thống

class Game {
    constructor(data) {
        this.id                 = data.id;
        this.steamAppid         = data.steam_appid;
        this.name               = data.name;
        this.shortDescription   = data.short_description;
        this.detailedDescription = data.detailed_description;
        this.headerImage        = data.header_image;
        this.screenshots        = data.screenshots        || [];
        this.genres             = data.genres             || [];
        this.categories         = data.categories         || [];
        this.priceUsd           = parseFloat(data.price_usd)  || 0;
        this.priceVnd           = parseInt(data.price_vnd)    || 0;
        this.isFree             = data.is_free            || false;
        this.developer          = data.developer          || '';
        this.publisher          = data.publisher          || '';
        this.releaseDate        = data.release_date       || '';
        this.metacriticScore    = data.metacritic_score   || null;
        this.platforms          = data.platforms          || {};
        this.tags               = data.tags               || [];
        this.owners             = data.owners             || '';
        this.positiveRatings    = parseInt(data.positive_ratings) || 0;
        this.negativeRatings    = parseInt(data.negative_ratings) || 0;
        this.createdAt          = data.created_at;
        this.updatedAt          = data.updated_at;
    }

    // Tổng lượt đánh giá
    get totalRatings() {
        return this.positiveRatings + this.negativeRatings;
    }

    // Tỉ lệ tích cực (0–100)
    get ratingPercent() {
        if (this.totalRatings === 0) return null;
        return Math.round((this.positiveRatings / this.totalRatings) * 100);
    }

    // Nhãn rating như Steam: Overwhelmingly Positive, Very Positive...
    get ratingLabel() {
        const pct   = this.ratingPercent;
        const total = this.totalRatings;
        if (pct === null || total < 10) return 'Chưa đủ đánh giá';
        if (pct >= 95 && total >= 500) return 'Cực kỳ tích cực';
        if (pct >= 80 && total >= 50)  return 'Rất tích cực';
        if (pct >= 70)                 return 'Tích cực';
        if (pct >= 40)                 return 'Lẫn lộn';
        if (pct >= 20)                 return 'Tiêu cực';
        return 'Rất tiêu cực';
    }

    // Giá hiển thị dạng string (VD: "249.000 ₫" hoặc "Miễn phí")
    get displayPrice() {
        if (this.isFree) return 'Miễn phí';
        if (this.priceVnd === 0) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', {
            style:    'currency',
            currency: 'VND',
        }).format(this.priceVnd);
    }

    // Trả về plain object gọn để gửi lên client (list view)
    toSummary() {
        return {
            id:             this.id,
            steamAppid:     this.steamAppid,
            name:           this.name,
            shortDescription: this.shortDescription,
            headerImage:    this.headerImage,
            genres:         this.genres,
            priceUsd:       this.priceUsd,
            priceVnd:       this.priceVnd,
            isFree:         this.isFree,
            developer:      this.developer,
            releaseDate:    this.releaseDate,
            metacriticScore: this.metacriticScore,
            ratingPercent:  this.ratingPercent,
            ratingLabel:    this.ratingLabel,
            displayPrice:   this.displayPrice,
            totalRatings:   this.totalRatings,
            platforms:      this.platforms,
            tags:           this.tags,
        };
    }

    // Trả về full object (detail view)
    toDetail() {
        return {
            ...this.toSummary(),
            detailedDescription: this.detailedDescription,
            screenshots:         this.screenshots,
            categories:          this.categories,
            publisher:           this.publisher,
            owners:              this.owners,
            positiveRatings:     this.positiveRatings,
            negativeRatings:     this.negativeRatings,
            createdAt:           this.createdAt,
            updatedAt:           this.updatedAt,
        };
    }

    // Static factory từ raw DB row
    static fromRow(row) {
        return new Game(row);
    }

    // Map array rows
    static fromRows(rows) {
        return rows.map((row) => Game.fromRow(row));
    }
}

module.exports = Game;
