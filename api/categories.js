const express = require('express');
const { checkAuth } = require('./auth.js');
const CategoriesQueries = require('../database/queries/categories.js');

const router = express.Router();

// Initialize categories queries
const categoriesQueries = new CategoriesQueries();

/**
 * GET /api/categories
 * Get all categories or filter by type
 */
router.get('/', checkAuth, async (req, res) => {
  try {
    const { type } = req.query;
    
    let result;
    if (type && (type === 'income' || type === 'expense')) {
      result = await categoriesQueries.getByType(type);
    } else {
      result = await categoriesQueries.selectAll();
    }

    if (result.error) {
      throw new Error(result.error.message);
    }

    res.json({
      success: true,
      categories: result.data || [],
      count: result.data?.length || 0
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/categories/income
 * Get all income categories
 */
router.get('/income', checkAuth, async (req, res) => {
  try {
    const result = await categoriesQueries.getIncomeCategories();
    
    if (result.error) {
      throw new Error(result.error.message);
    }

    res.json({
      success: true,
      categories: result.data || [],
      count: result.data?.length || 0
    });

  } catch (error) {
    console.error('Get income categories error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/categories/expense
 * Get all expense categories
 */
router.get('/expense', checkAuth, async (req, res) => {
  try {
    const result = await categoriesQueries.getExpenseCategories();
    
    if (result.error) {
      throw new Error(result.error.message);
    }

    res.json({
      success: true,
      categories: result.data || [],
      count: result.data?.length || 0
    });

  } catch (error) {
    console.error('Get expense categories error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/categories
 * Create new category
 */
router.post('/', checkAuth, async (req, res) => {
  try {
    const { name, type, description } = req.body;

    // Validate input
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Name and type are required'
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type must be either "income" or "expense"'
      });
    }

    const result = await categoriesQueries.createCategory(name.trim(), type, description);
    
    if (result.error) {
      throw new Error(result.error.message);
    }

    res.status(201).json({
      success: true,
      category: result.data,
      message: `Category "${name}" created successfully`
    });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/categories/:id
 * Update category
 */
router.put('/:id', checkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, description } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Category ID is required'
      });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (description !== undefined) updates.description = description;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one field to update is required'
      });
    }

    const result = await categoriesQueries.updateCategory(id, updates);
    
    if (result.error) {
      throw new Error(result.error.message);
    }

    res.json({
      success: true,
      category: result.data,
      message: 'Category updated successfully'
    });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/categories/:id
 * Delete category
 */
router.delete('/:id', checkAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Category ID is required'
      });
    }

    // Check if category can be deleted (no associated transactions)
    const canDelete = await categoriesQueries.canDelete(id);
    
    if (!canDelete) {
      return res.status(409).json({
        success: false,
        error: 'Cannot delete category that has associated transactions'
      });
    }

    const result = await categoriesQueries.deleteCategory(id);
    
    if (result.error) {
      throw new Error(result.error.message);
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/categories/:id
 * Get category by ID
 */
router.get('/:id', checkAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Category ID is required'
      });
    }

    const result = await categoriesQueries.selectById(id);
    
    if (result.error) {
      if (result.error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }
      throw new Error(result.error.message);
    }

    res.json({
      success: true,
      category: result.data
    });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/categories/prompt/format
 * Get categories formatted for AI prompts and CSV processing
 */
router.get('/prompt/format', checkAuth, async (req, res) => {
  try {
    const result = await categoriesQueries.getCategoriesForPrompt();
    
    res.json({
      success: true,
      categories: result
    });

  } catch (error) {
    console.error('Get categories for prompt error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
