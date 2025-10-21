const RulesQueries = require('../database/queries/rules.js');

/**
 * Rule Engine for categorization rules processing
 * Handles pattern matching and rule priority resolution
 */
class RuleEngine {
  constructor() {
    this.rulesQueries = new RulesQueries();
    this.ruleCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Apply categorization rules to operations before AI processing
   */
  async categorizeWithRules(operations, categories = null) {
    try {
      // Get applicable rules (may be cached)
      const rules = await this.getRulesForOperations(operations);
      
      if (!rules || rules.length === 0) {
        console.log('No categorization rules found, skipping rule-based categorization');
        return operations.map(op => ({
          ...op,
          ruleMatched: false,
          ruleUsed: null
        }));
      }

      console.log(`Applying ${rules.length} categorization rules to ${operations.length} operations`);
      
      const categorizedOperations = [];
      let rulesApplied = 0;

      for (const operation of operations) {
        const ruleResult = await this.applyRulesToOperation(operation, rules);
        
        if (ruleResult.matched) {
          rulesApplied++;
          // Increment usage count for the rule
          await this.rulesQueries.incrementUsage(ruleResult.rule.id);
          
          categorizedOperations.push({
            ...operation,
            category: ruleResult.category,
            category_id: ruleResult.categoryId,
            ruleMatched: true,
            ruleUsed: ruleResult.rule.pattern,
            categorizationMethod: 'rule'
          });
        } else {
          categorizedOperations.push({
            ...operation,
            ruleMatched: false,
            ruleUsed: null,
            categorizationMethod: 'pending'
          });
        }
      }

      console.log(`Rules applied to ${rulesApplied} out of ${operations.length} operations`);
      
      return categorizedOperations;
      
    } catch (error) {
      console.error('Rule engine error:', error);
      // Return operations unchanged if rules fail
      return operations.map(op => ({
        ...op,
        ruleMatched: false,
        ruleUsed: null,
        categorizationMethod: 'pending'
      }));
    }
  }

  /**
   * Get rules that might apply to the given operations
   */
  async getRulesForOperations(operations) {
    try {
      // For efficiency, get all rules and cache them
      const cachedRules = this.getCachedRules();
      if (cachedRules) {
        return cachedRules;
      }

      const result = await this.rulesQueries.getAllRules();
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      const rules = result.data || [];
      
      // Cache the rules
      this.ruleCache.set('all_rules', {
        rules: rules,
        timestamp: Date.now()
      });

      return rules;
      
    } catch (error) {
      console.error('Error getting rules for operations:', error);
      return [];
    }
  }

  /**
   * Get cached rules
   */
  getCachedRules() {
    const cached = this.ruleCache.get('all_rules');
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.rules;
    }
    return null;
  }

  /**
   * Apply rules to a single operation
   */
  async applyRulesToOperation(operation, rules) {
    const description = operation.description || '';
    
    if (!description.trim()) {
      return { matched: false };
    }

    // Find matching rules (sorted by priority already)
    const matchingRules = rules.filter(rule => this.ruleMatches(description, rule));
    
    if (matchingRules.length === 0) {
      return { matched: false };
    }

    // Use the highest priority rule (first in sorted array)
    const bestRule = matchingRules[0];
    
    return {
      matched: true,
      rule: bestRule,
      category: bestRule.categories?.name || 'Unknown Category',
      categoryId: bestRule.category_id
    };
  }

  /**
   * Check if a rule matches the operation description
   */
  ruleMatches(description, rule) {
    if (!rule.pattern || !description) {
      return false;
    }

    const pattern = rule.pattern.toLowerCase().trim();
    const desc = description.toLowerCase().trim();

    try {
      // Try exact match first
      if (pattern === desc) {
        return true;
      }

      // Try contains match
      if (pattern.length > 3 && desc.includes(pattern)) {
        return true;
      }

      // Try regex match (if pattern looks like regex)
      if (pattern.startsWith('^') || pattern.includes('.*') || pattern.includes('[^')) {
        try {
          const regex = new RegExp(pattern, 'i');
          return regex.test(description);
        } catch (e) {
          // Invalid regex, fall back to contains
          return desc.includes(pattern);
        }
      }

      // Try word boundary matching for better precision
      const words = pattern.split(/\s+/);
      if (words.length > 1) {
        return words.every(word => desc.includes(word));
      }

      return false;
      
    } catch (error) {
      console.warn(`Error matching rule pattern "${pattern}":`, error.message);
      return false;
    }
  }

  /**
   * Create a new categorization rule from user correction
   */
  async createRuleFromCorrection(operationDescription, categoryId, categoryName) {
    try {
      if (!operationDescription || !categoryId) {
        throw new Error('Operation description and category ID are required');
      }

      // Use the full description as pattern for exact matching
      // In future, we could make this smarter (extract keywords, etc.)
      const pattern = operationDescription.trim();
      
      const result = await this.rulesQueries.createRule(pattern, categoryId);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      console.log(`Created rule: "${pattern}" → "${categoryName}"`);
      
      // Clear cache to force refresh
      this.clearCache();
      
      return {
        success: true,
        rule: result.data,
        message: `Rule created: "${pattern}" → "${categoryName}"`
      };
      
    } catch (error) {
      console.error('Error creating rule from correction:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update rule usage statistics
   */
  async updateRuleStats() {
    try {
      const stats = await this.rulesQueries.getRuleStats();
      console.log('Rule engine stats:', stats);
      return stats;
    } catch (error) {
      console.error('Error getting rule stats:', error);
      return null;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.ruleCache.clear();
  }

  /**
   * Get rules that need to be applied before AI categorization
   */
  async getPendingRules(operations) {
    const operationsNeedingRules = operations.filter(op => !op.ruleMatched);
    return operationsNeedingRules;
  }
}

module.exports = RuleEngine;
