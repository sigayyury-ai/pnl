const { supabase } = require('../supabase.js');
const { DatabaseQueries } = require('./index.js');

class CategoriesQueries extends DatabaseQueries {
  constructor() {
    // Используем существующие таблицы вместо categories
    super('categories'); // Будем переопределять методы
    this.incomeTable = 'pnl_income_categories';
    this.expenseTable = 'pnl_expense_categories';
  }

  /**
   * Get all categories by type (используем существующие таблицы)
   */
  async getByType(type) {
    const tableName = type === 'income' ? this.incomeTable : this.expenseTable;
    return await this.executeQuery(() => 
      supabase.from(tableName)
        .select('*')
        .order('name', { ascending: true })
    );
  }

  /**
   * Get all income categories
   */
  async getIncomeCategories() {
    return await this.executeQuery(() => 
      supabase.from(this.incomeTable)
        .select('*')
        .order('name', { ascending: true })
    );
  }

  /**
   * Get all expense categories
   */
  async getExpenseCategories() {
    return await this.executeQuery(() => 
      supabase.from(this.expenseTable)
        .select('*')
        .order('name', { ascending: true })
    );
  }

  /**
   * Get all categories from both income and expense tables
   */
  async selectAll() {
    try {
      const [incomeResult, expenseResult] = await Promise.all([
        this.getIncomeCategories(),
        this.getExpenseCategories()
      ]);

      if (incomeResult.error || expenseResult.error) {
        throw new Error(`Query failed: ${incomeResult.error?.message || expenseResult.error?.message}`);
      }

      // Объединяем результаты и добавляем поле type
      const incomeCategories = (incomeResult.data || []).map(cat => ({ ...cat, type: 'income' }));
      const expenseCategories = (expenseResult.data || []).map(cat => ({ ...cat, type: 'expense' }));
      
      return {
        data: [...incomeCategories, ...expenseCategories],
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get category by name and type
   */
  async getByNameAndType(name, type) {
    const tableName = type === 'income' ? this.incomeTable : this.expenseTable;
    return await this.executeQuery(() => 
      supabase.from(tableName)
        .select('*')
        .eq('name', name)
        .single()
    );
  }

  /**
   * Check if category exists by name and type
   */
  async existsByNameAndType(name, type) {
    const tableName = type === 'income' ? this.incomeTable : this.expenseTable;
    const result = await this.executeQuery(() => 
      supabase.from(tableName)
        .select('id', { count: 'exact', head: true })
        .eq('name', name)
    );
    return result.count > 0;
  }

  /**
   * Create category with validation (используем существующие таблицы)
   */
  async createCategory(name, type, description = null) {
    if (!name || !type) {
      throw new Error('Name and type are required');
    }

    if (!['income', 'expense'].includes(type)) {
      throw new Error('Type must be either "income" or "expense"');
    }

    const tableName = type === 'income' ? this.incomeTable : this.expenseTable;

    // Check if category already exists
    const exists = await this.existsByNameAndType(name, type);
    if (exists) {
      throw new Error(`Category "${name}" of type "${type}" already exists`);
    }

    // Используем правильную таблицу для вставки
    return await this.executeQuery(() => 
      supabase.from(tableName)
        .insert({
          name: name.trim(),
          description: description ? description.trim() : null,
          is_default: false
        })
        .select()
    );
  }

  /**
   * Update category with validation
   */
  async updateCategory(id, updates) {
    if (!id) {
      throw new Error('Category ID is required');
    }

    // Validate type if provided
    if (updates.type && !['income', 'expense'].includes(updates.type)) {
      throw new Error('Type must be either "income" or "expense"');
    }

    // Check if name already exists for the same type (excluding current category)
    if (updates.name && updates.type) {
      const existing = await this.executeQuery(() => 
        supabase.from(this.table)
          .select('id')
          .eq('name', updates.name.trim())
          .eq('type', updates.type)
          .neq('id', id)
          .single()
      );
      
      if (existing.data) {
        throw new Error(`Category "${updates.name}" of type "${updates.type}" already exists`);
      }
    }

    // Clean up updates
    const cleanUpdates = {};
    if (updates.name) cleanUpdates.name = updates.name.trim();
    if (updates.type) cleanUpdates.type = updates.type;
    if (updates.description !== undefined) cleanUpdates.description = updates.description ? updates.description.trim() : null;

    return await this.update(id, cleanUpdates);
  }

  /**
   * Check if category can be deleted (no associated transactions)
   */
  async canDelete(id) {
    const result = await this.executeQuery(() => 
      supabase.from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', id)
    );
    
    return result.count === 0;
  }

  /**
   * Delete category with safety check
   */
  async deleteCategory(id) {
    const canDelete = await this.canDelete(id);
    if (!canDelete) {
      throw new Error('Cannot delete category that has associated transactions');
    }

    return await this.delete(id);
  }

  /**
   * Get categories formatted for CSV processing/ChatGPT prompts
   */
  async getCategoriesForPrompt() {
    try {
      const result = await this.selectAll();
      if (result.error) throw result.error;

      const categories = result.data || [];
      const incomeCategories = categories.filter(c => c.type === 'income').map(c => c.name);
      const expenseCategories = categories.filter(c => c.type === 'expense').map(c => c.name);

      return {
        income: incomeCategories,
        expense: expenseCategories,
        all: categories
      };
    } catch (error) {
      console.warn('Database unavailable, cannot load categories:', error.message);
      // Re-throw the error so it can be handled by the calling code
      throw error;
    }
  }
}

module.exports = CategoriesQueries;
