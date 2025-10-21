const { supabase } = require('../supabase.js');
const { DatabaseQueries } = require('./index.js');

class RulesQueries extends DatabaseQueries {
  constructor() {
    super('categorization_rules');
  }

  /**
   * Get all categorization rules
   */
  async getAllRules() {
    return await this.executeQuery(() => 
      supabase.from(this.table)
        .select(`
          *,
          categories (
            id,
            name,
            type
          )
        `)
        .order('usage_count', { ascending: false })
        .order('created_at', { ascending: false })
    );
  }

  /**
   * Get rules by pattern (for matching during CSV processing)
   */
  async getRulesByPattern(description) {
    if (!description || typeof description !== 'string') {
      return { data: [] };
    }

    // Get all rules and match them client-side for flexibility
    const result = await this.executeQuery(() => 
      supabase.from(this.table)
        .select(`
          *,
          categories (
            id,
            name,
            type
          )
        `)
    );

    if (result.error) {
      throw new Error(result.error.message);
    }

    const rules = result.data || [];
    const matchingRules = [];

    // Match patterns (exact match, contains, or regex patterns)
    rules.forEach(rule => {
      const pattern = rule.pattern.toLowerCase();
      const descriptionLower = description.toLowerCase();

      if (pattern === descriptionLower) {
        // Exact match - highest priority
        matchingRules.push({ ...rule, matchType: 'exact', priority: 1 });
      } else if (descriptionLower.includes(pattern)) {
        // Contains match - medium priority
        matchingRules.push({ ...rule, matchType: 'contains', priority: 2 });
      } else {
        // Try regex match
        try {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(description)) {
            matchingRules.push({ ...rule, matchType: 'regex', priority: 3 });
          }
        } catch (e) {
          // Invalid regex, skip
        }
      }
    });

    // Sort by priority and usage count
    matchingRules.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return b.usage_count - a.usage_count;
    });

    return { data: matchingRules };
  }

  /**
   * Create new categorization rule
   */
  async createRule(pattern, categoryId, description = null, priority = 5) {
    if (!pattern || !categoryId) {
      throw new Error('Pattern and category ID are required');
    }

    // Check if rule already exists
    const existing = await this.executeQuery(() => 
      supabase.from(this.table)
        .select('id')
        .eq('pattern', pattern)
        .eq('category_id', categoryId)
        .maybeSingle()
    );

    if (existing.error && existing.error.code !== 'PGRST116') {
      throw new Error(existing.error.message);
    }

    if (existing.data) {
      throw new Error('Rule with this pattern and category already exists');
    }

    return await this.insert({
      pattern: pattern.trim(),
      category_id: categoryId,
      description: description || `Rule for pattern: ${pattern}`,
      priority: priority,
      usage_count: 0,
      is_active: true
    });
  }

  /**
   * Update rule usage count when rule is applied
   */
  async incrementUsage(ruleId) {
    if (!ruleId) {
      throw new Error('Rule ID is required');
    }

    // Get current usage count
    const current = await this.executeQuery(() => 
      supabase.from(this.table).select('usage_count').eq('id', ruleId).single()
    );

    if (current.error) {
      console.warn('Could not get current usage count for rule:', ruleId);
      return { data: null };
    }

    const newCount = (current.data?.usage_count || 0) + 1;

    // Update usage count
    return await this.executeQuery(() => 
      supabase.from(this.table)
        .update({ usage_count: newCount })
        .eq('id', ruleId)
        .select()
        .single()
    );
  }

  /**
   * Update rule pattern or category
   */
  async updateRule(ruleId, updates) {
    if (!ruleId) {
      throw new Error('Rule ID is required');
    }

    const cleanUpdates = {};
    if (updates.pattern !== undefined) cleanUpdates.pattern = updates.pattern.trim();
    if (updates.category_id !== undefined) cleanUpdates.category_id = updates.category_id;
    if (updates.description !== undefined) cleanUpdates.description = updates.description;
    if (updates.priority !== undefined) cleanUpdates.priority = updates.priority;
    if (updates.is_active !== undefined) cleanUpdates.is_active = updates.is_active;

    if (Object.keys(cleanUpdates).length === 0) {
      throw new Error('No valid updates provided');
    }

    return await this.update(ruleId, cleanUpdates);
  }

  /**
   * Delete rule by ID
   */
  async deleteRule(ruleId) {
    if (!ruleId) {
      throw new Error('Rule ID is required');
    }

    const result = await this.executeQuery(() => 
      supabase.from(this.table).delete().eq('id', ruleId)
    );

    return { deletedCount: result.error ? 0 : 1 };
  }

  /**
   * Get rules statistics
   */
  async getRuleStats() {
    const result = await this.executeQuery(() => 
      supabase.from(this.table)
        .select('usage_count', { count: 'exact', head: false })
    );

    if (result.error) {
      throw new Error(result.error.message);
    }

    const rules = result.data || [];
    const totalRules = rules.length;
    const totalUsage = rules.reduce((sum, rule) => sum + (rule.usage_count || 0), 0);
    const averageUsage = totalRules > 0 ? totalUsage / totalRules : 0;

    return {
      totalRules,
      totalUsage,
      averageUsage,
      mostUsedRules: rules
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 5)
    };
  }

  /**
   * Get rules by category
   */
  async getRulesByCategory(categoryId) {
    return await this.executeQuery(() => 
      supabase.from(this.table)
        .select(`
          *,
          categories (
            id,
            name,
            type
          )
        `)
        .eq('category_id', categoryId)
        .order('usage_count', { ascending: false })
    );
  }

  /**
   * Search rules by pattern
   */
  async searchRules(searchTerm) {
    return await this.executeQuery(() => 
      supabase.from(this.table)
        .select(`
          *,
          categories (
            id,
            name,
            type
          )
        `)
        .ilike('pattern', `%${searchTerm}%`)
        .order('usage_count', { ascending: false })
    );
  }
}

module.exports = RulesQueries;
