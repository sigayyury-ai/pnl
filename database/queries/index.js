const { supabase } = require('../supabase.js');

/**
 * Base query helper functions
 */
class DatabaseQueries {
  constructor(tableName) {
    this.table = tableName;
  }

  /**
   * Execute a query with error handling
   */
  async executeQuery(queryFn, errorMessage = 'Database query failed') {
    try {
      const result = await queryFn();
      
      if (result.error) {
        console.error(`${errorMessage}:`, result.error);
        throw new Error(`${errorMessage}: ${result.error.message}`);
      }
      
      return result;
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      throw error;
    }
  }

  /**
   * Select all records
   */
  async selectAll(filters = {}) {
    let query = supabase.from(this.table).select('*');
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    return await this.executeQuery(() => query);
  }

  /**
   * Select single record by ID
   */
  async selectById(id) {
    return await this.executeQuery(() => 
      supabase.from(this.table).select('*').eq('id', id).single()
    );
  }

  /**
   * Insert new record
   */
  async insert(data) {
    return await this.executeQuery(() => 
      supabase.from(this.table).insert(data).select().single()
    );
  }

  /**
   * Update record by ID
   */
  async update(id, data) {
    return await this.executeQuery(() => 
      supabase.from(this.table).update(data).eq('id', id).select().single()
    );
  }

  /**
   * Delete record by ID
   */
  async delete(id) {
    return await this.executeQuery(() => 
      supabase.from(this.table).delete().eq('id', id)
    );
  }

  /**
   * Check if record exists
   */
  async exists(filters) {
    let query = supabase.from(this.table).select('id', { count: 'exact', head: true });
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const result = await this.executeQuery(() => query);
    return result.count > 0;
  }
}

module.exports = {
  DatabaseQueries
};
