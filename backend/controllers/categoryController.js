const db = require('../config/db');

// @desc Get user categories/tags
// @route GET /api/categories
const getCategories = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { rows } = await db.query(
      'SELECT id, name, color, created_at FROM categories WHERE user_id = $1 ORDER BY name ASC',
      [userId]
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create category
// @route POST /api/categories
const createCategory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, color = '#6b7280' } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const result = await db.query(
      `INSERT INTO categories (user_id, name, color)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, name) DO UPDATE SET color = EXCLUDED.color
       RETURNING *`,
      [userId, name.trim(), color]
    );

    res.status(201).json({
      success: true,
      message: 'Category created/updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete category
// @route DELETE /api/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const userId = req.user.id;

    const result = await db.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
      [categoryId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found or not owned by user.' });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  deleteCategory
};
