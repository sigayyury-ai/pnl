const { supabase } = require('../supabase.js');
const { DatabaseQueries } = require('./index.js');

class TransactionsQueries extends DatabaseQueries {
  constructor() {
    super('operations'); // Используем существующую таблицу operations
  }

  /**
   * Get transactions by year and month
   */
  async getByYearMonth(year, month) {
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
        .eq('year', year)
        .eq('month', month)
        .order('date', { ascending: true })
    );
  }

  /**
   * Get transactions by year
   */
  async getByYear(year) {
    return await this.executeQuery(() => 
      supabase.from(this.table)
        .select('*')
        .eq('year', year)
        .order('month', { ascending: true })
        .order('id', { ascending: true })
    );
  }

  /**
   * Get transactions by date range
   */
  async getByDateRange(startDate, endDate) {
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
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
    );
  }

  /**
   * Get transactions by category
   */
  async getByCategory(categoryId) {
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
        .order('date', { ascending: false })
    );
  }

  /**
   * Get transactions without category (uncategorized)
   */
  async getUncategorized(year = null, month = null) {
    let query = supabase.from(this.table)
      .select(`
        *,
        categories (
          id,
          name,
          type
        )
      `)
      .is('category_id', null);

    if (year) {
      query = query.eq('year', year);
    }
    if (month) {
      query = query.eq('month', month);
    }

    return await this.executeQuery(() => query.order('date', { ascending: false }));
  }

  /**
   * Insert multiple transactions in batch
   */
  async insertBatch(transactions) {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      throw new Error('Transactions array is required and must not be empty');
    }

    // Преобразуем данные под структуру таблицы operations
    const operationsData = transactions.map(tx => {
      // Определяем тип по знаку amount
      const type = (tx.amount >= 0) ? 'income' : 'expense';
      
      return {
        description: tx.description,
        amount: Math.abs(tx.amount), // Убираем знак, так как type уже показывает income/expense
        currency: tx.original_currency || tx.currency,
        converted_amount: tx.amount_pln,
        category: tx.category || 'Other', // Используем строковое название категории
        month: tx.month,
        year: tx.year,
        type: type
      };
    });

    // Validate operation structure
    operationsData.forEach((op, index) => {
      if (!op.description || op.amount === undefined || !op.currency || op.converted_amount === undefined || !op.month || !op.year || !op.type) {
        throw new Error(`Operation at index ${index} missing required fields: ${JSON.stringify(op)}`);
      }
    });

    return await this.executeQuery(() => 
      supabase.from(this.table)
        .insert(operationsData)
        .select('*')
    );
  }

  /**
   * Update transaction category
   */
  async updateCategory(transactionId, categoryId) {
    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }

    const updates = {};
    if (categoryId === null || categoryId === undefined) {
      updates.category_id = null;
    } else {
      updates.category_id = categoryId;
    }

    return await this.update(transactionId, updates);
  }

  /**
   * Delete transactions by year and month (for re-upload scenarios)
   */
  async deleteByYearMonth(year, month) {
    return await this.executeQuery(() => 
      supabase.from(this.table)
        .delete()
        .eq('year', year)
        .eq('month', month)
    );
  }

  /**
   * Get aggregated financial data by category and month
   */
  async getAggregatedByCategoryAndMonth(year) {
    return await this.executeQuery(() => 
      supabase.rpc('get_monthly_category_totals', { target_year: year })
    );
  }

  /**
   * Get summary statistics for a period
   */
  async getSummaryStats(year, month = null) {
    let query = supabase.from(this.table)
      .select(`
        amount_pln,
        operation_type,
        categories!inner (
          type
        )
      `)
      .eq('year', year);

    if (month) {
      query = query.eq('month', month);
    }

    const result = await this.executeQuery(() => query);
    
    if (result.error) {
      throw result.error;
    }

    const transactions = result.data || [];
    
    // Calculate summary statistics
    const summary = {
      totalIncome: 0,
      totalExpenses: 0,
      transactionCount: transactions.length,
      categoryBreakdown: {}
    };

    transactions.forEach(tx => {
      const amount = parseFloat(tx.amount_pln) || 0;
      const categoryType = tx.categories?.type;
      
      if (categoryType === 'income') {
        summary.totalIncome += amount;
      } else if (categoryType === 'expense') {
        summary.totalExpenses += amount;
      }
    });

    summary.netResult = summary.totalIncome - summary.totalExpenses;

    return {
      success: true,
      data: summary
    };
  }

  /**
   * Search transactions by description
   */
  async searchByDescription(searchTerm, year = null, month = null) {
    let query = supabase.from(this.table)
      .select(`
        *,
        categories (
          id,
          name,
          type
        )
      `)
      .ilike('description', `%${searchTerm}%`);

    if (year) {
      query = query.eq('year', year);
    }
    if (month) {
      query = query.eq('month', month);
    }

    return await this.executeQuery(() => query.order('date', { ascending: false }));
  }

  /**
   * Check if transactions exist for year/month (for duplicate prevention)
   */
  async existsForYearMonth(year, month) {
    const result = await this.executeQuery(() => 
      supabase.from(this.table)
        .select('id', { count: 'exact', head: true })
        .eq('year', year)
        .eq('month', month)
    );
    
    return result.count > 0;
  }

  /**
   * Delete transactions by category name, month and year
   */
  async deleteByCategoryMonthYear(categoryName, month, year) {
    return await this.executeQuery(() => 
      supabase.from(this.table)
        .delete()
        .eq('category', categoryName)
        .eq('month', month)
        .eq('year', year)
    );
  }
}

module.exports = TransactionsQueries;
