const { body, param } = require('express-validator');

const createPostRules = [
  body('content')
    .trim()
    .notEmpty().withMessage('Nội dung không được để trống')
    .isLength({ max: 2000 }).withMessage('Nội dung quá dài (tối đa 2000 ký tự)'),
];

const updatePostRules = [
  param('postId').isInt({ min: 1 }).withMessage('Post ID không hợp lệ'),
  ...createPostRules,
];

const addCommentRules = [
  param('postId').isInt({ min: 1 }).withMessage('Post ID không hợp lệ'),
  body('content')
    .trim()
    .notEmpty().withMessage('Nội dung bình luận không được để trống')
    .isLength({ max: 500 }).withMessage('Bình luận tối đa 500 ký tự'),
];

const updateCommentRules = [
  param('commentId').isInt({ min: 1 }).withMessage('Comment ID không hợp lệ'),
  body('content')
    .trim()
    .notEmpty().withMessage('Nội dung bình luận không được để trống')
    .isLength({ max: 500 }).withMessage('Bình luận tối đa 500 ký tự'),
];

module.exports = {
  createPostRules,
  updatePostRules,
  addCommentRules,
  updateCommentRules,
};
