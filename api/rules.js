const express = require('express');
const router = express.Router();
const { checkAuth } = require('./auth.js');
const RulesQueries = require('../database/queries/rules.js');

const rulesQueries = new RulesQueries();

/**
 * GET /api/rules - Get all categorization rules
 */
router.get('/', checkAuth, async (req, res) => {
  try {
    const result = await rulesQueries.getAllRules();
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error.message || 'Failed to fetch rules'
      });
    }

    res.json({
      success: true,
      rules: result.data || [],
      count: result.data ? result.data.length : 0
    });

  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rules'
    });
  }
});

/**
 * POST /api/rules - Create a new categorization rule
 */
router.post('/', checkAuth, async (req, res) => {
  try {
    const { pattern, category_id, description, priority = 5 } = req.body;
    
    if (!pattern || !category_id) {
      return res.status(400).json({
        success: false,
        error: 'Pattern and category_id are required'
      });
    }

    const result = await rulesQueries.createRule(pattern, category_id, description, priority);
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error.message || 'Failed to create rule'
      });
    }

    res.status(201).json({
      success: true,
      rule: result.data,
      message: 'Rule created successfully'
    });

  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create rule'
    });
  }
});

/**
 * PUT /api/rules/:id - Update an existing rule
 */
router.put('/:id', checkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { pattern, category_id, description, priority, is_active } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Rule ID is required'
      });
    }

    const updateData = {};
    if (pattern !== undefined) updateData.pattern = pattern;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (is_active !== undefined) updateData.is_active = is_active;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No update data provided'
      });
    }

    const result = await rulesQueries.updateRule(id, updateData);
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error.message || 'Failed to update rule'
      });
    }

    if (!result.data) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }

    res.json({
      success: true,
      rule: result.data,
      message: 'Rule updated successfully'
    });

  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update rule'
    });
  }
});

/**
 * DELETE /api/rules/:id - Delete a rule
 */
router.delete('/:id', checkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Rule ID is required'
      });
    }

    const result = await rulesQueries.deleteRule(id);
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error.message || 'Failed to delete rule'
      });
    }

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Rule deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete rule'
    });
  }
});

/**
 * POST /api/rules/test - Test a rule pattern against sample text
 */
router.post('/test', checkAuth, async (req, res) => {
  try {
    const { pattern, test_text } = req.body;
    
    if (!pattern || !test_text) {
      return res.status(400).json({
        success: false,
        error: 'Pattern and test_text are required'
      });
    }

    // Simple pattern matching logic (similar to RuleEngine)
    const pattern_lower = pattern.toLowerCase().trim();
    const text_lower = test_text.toLowerCase().trim();
    
    let matches = false;
    let matchType = 'none';

    try {
      // Try exact match
      if (pattern_lower === text_lower) {
        matches = true;
        matchType = 'exact';
      }
      // Try contains match
      else if (pattern_lower.length > 3 && text_lower.includes(pattern_lower)) {
        matches = true;
        matchType = 'contains';
      }
      // Try regex match
      else if (pattern_lower.startsWith('^') || pattern_lower.includes('.*')) {
        const regex = new RegExp(pattern_lower, 'i');
        matches = regex.test(test_text);
        matchType = 'regex';
      }
    } catch (regexError) {
      console.warn('Regex test failed:', regexError.message);
    }

    res.json({
      success: true,
      result: {
        matches,
        matchType,
        pattern,
        testText: test_text
      }
    });

  } catch (error) {
    console.error('Error testing rule pattern:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test rule pattern'
    });
  }
});

/**
 * GET /api/rules/stats - Get rule usage statistics
 */
router.get('/stats', checkAuth, async (req, res) => {
  try {
    const result = await rulesQueries.getRuleStats();
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error.message || 'Failed to fetch rule statistics'
      });
    }

    res.json({
      success: true,
      stats: result.data || {}
    });

  } catch (error) {
    console.error('Error fetching rule stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rule statistics'
    });
  }
});

module.exports = router;
