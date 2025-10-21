const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { checkAuth } = require('./auth.js');
const CSVProcessor = require('../services/csvProcessor.js');
const TransactionsQueries = require('../database/queries/transactions.js');
const CategoriesQueries = require('../database/queries/categories.js');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp/' : 'uploads/';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'csv-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Initialize services
const csvProcessor = new CSVProcessor();
const transactionsQueries = new TransactionsQueries();
const categoriesQueries = new CategoriesQueries();

/**
 * Parse CSV file using PapaParse
 */
function parseCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const csvData = fs.readFileSync(filePath, 'utf8');
    
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        resolve(results.data);
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      }
    });
  });
}


/**
 * POST /api/analyze-csv
 * Upload and analyze CSV file with currency conversion and categorization
 */
router.post('/analyze-csv', checkAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No CSV file uploaded'
      });
    }

    const { year, month } = req.body;
    
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Year and month are required'
      });
    }

    console.log(`Processing CSV file: ${req.file.originalname} for ${year}-${month}`);

    // Parse CSV file
    const csvData = await parseCSVFile(req.file.path);
    
    if (!csvData || csvData.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'CSV file is empty or could not be parsed'
      });
    }

    // Get available categories for categorization (with fallback)
    let categoriesResult;
    try {
      categoriesResult = await categoriesQueries.getCategoriesForPrompt();
      console.log('✅ Categories loaded from database:', categoriesResult);
    } catch (dbError) {
      console.warn('⚠️ Database unavailable, using fallback categories:', dbError.message);
      // Fallback categories for development/testing
      categoriesResult = {
        income: ['Sales Revenue', 'Client Payments', 'Other Income'],
        expense: ['Office Supplies', 'Rent', 'Food & Dining', 'Transportation', 'Marketing', 'Other']
      };
    }

    // Process CSV using CSVProcessor service
    const processResult = await csvProcessor.processCSV(csvData, categoriesResult, year, month);

    // Clean up uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (err) {
      console.warn('Could not delete uploaded file:', err.message);
    }

    res.json({
      success: true,
      operations: processResult.operations,
      summary: processResult.summary,
      categories: categoriesResult,
      year: processResult.year,
      month: processResult.month
    });

  } catch (error) {
    console.error('CSV analysis error:', error);
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.warn('Could not delete uploaded file on error:', err.message);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process CSV file'
    });
  }
});

/**
 * POST /api/save-results
 * Save processed CSV results to database
 */
router.post('/save-results', checkAuth, async (req, res) => {
  // Извлекаем данные из запроса ДО try блока, чтобы они были доступны в catch
  const operations = req.body.operations;
  const year = req.body.year;
  const month = req.body.month;
  const overwrite = req.body.overwrite || false; // Параметр для перезаписи данных
  
  try {

    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Operations array is required'
      });
    }

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Year and month are required'
      });
    }

    // Check if operations already exist for this year/month
    try {
      const existsForPeriod = await transactionsQueries.existsForYearMonth(year, month);
      if (existsForPeriod && !overwrite) {
        return res.status(409).json({
          success: false,
          error: `Operations already exist for ${year}-${month}. Delete existing data first or choose a different period.`,
          overwriteAvailable: true
        });
      }
      
      // Если overwrite = true, удаляем существующие данные
      if (existsForPeriod && overwrite) {
        console.log(`Overwriting existing data for ${year}-${month}`);
        const deleteResult = await transactionsQueries.deleteByYearMonth(year, month);
        if (deleteResult.error) {
          console.warn('Failed to delete existing data:', deleteResult.error);
        } else {
          console.log(`Deleted ${deleteResult.count || 0} existing operations for ${year}-${month}`);
        }
      }
    } catch (dbError) {
      console.warn('Database check failed, proceeding anyway:', dbError.message);
    }

    // Get all categories to map category names to IDs
    let categoriesMap = new Map();
    try {
      const categoriesResult = await categoriesQueries.selectAll();
      if (categoriesResult.data) {
        categoriesResult.data.forEach(cat => {
          categoriesMap.set(cat.name, cat.id);
        });
      }
    } catch (dbError) {
      console.warn('Could not load categories for mapping, continuing without category IDs:', dbError.message);
    }

    // Auto-create missing categories from operations
    const uniqueCategories = new Set();
    operations.forEach(op => {
      if (op.category && op.category.trim()) {
        if (!categoriesMap.has(op.category)) {
          uniqueCategories.add(op.category);
        }
      }
    });

    // Create missing categories
    const createdCategories = [];
    for (const categoryName of uniqueCategories) {
      try {
        // Check if category already exists in database before creating
        const existingCategory = await categoriesQueries.getByNameAndType(categoryName, 'income');
        if (existingCategory.data) {
          categoriesMap.set(categoryName, existingCategory.data.id);
          console.log(`✅ Found existing income category: ${categoryName} with ID: ${existingCategory.data.id}`);
          continue;
        }
        
        const existingExpenseCategory = await categoriesQueries.getByNameAndType(categoryName, 'expense');
        if (existingExpenseCategory.data) {
          categoriesMap.set(categoryName, existingExpenseCategory.data.id);
          console.log(`✅ Found existing expense category: ${categoryName} with ID: ${existingExpenseCategory.data.id}`);
          continue;
        }
        
        // Find a related operation to determine category type
        const relatedOperation = operations.find(op => op.category === categoryName);
        
        // Use operation_type field if available, otherwise fallback to amount sign
        let categoryType = 'expense'; // default
        if (relatedOperation) {
          if (relatedOperation.operation_type) {
            categoryType = relatedOperation.operation_type;
          } else if (relatedOperation.type) {
            categoryType = relatedOperation.type;
          } else {
            // Fallback to amount sign (legacy logic)
            categoryType = (relatedOperation.amount >= 0) ? 'income' : 'expense';
          }
        }
        
        console.log(`Creating new category: "${categoryName}" as ${categoryType} based on operation:`, {
          operation_type: relatedOperation?.operation_type,
          type: relatedOperation?.type,
          amount: relatedOperation?.amount
        });
        
        const createResult = await categoriesQueries.createCategory(categoryName, categoryType);
        if (createResult.data && createResult.data[0]) {
          const newCategory = createResult.data[0];
          categoriesMap.set(categoryName, newCategory.id);
          createdCategories.push(newCategory);
          console.log(`✅ Created category: ${categoryName} (${categoryType}) with ID: ${newCategory.id}`);
        }
      } catch (createError) {
        console.warn(`Failed to create category "${categoryName}":`, createError.message);
      }
    }

    // Prepare operations for database insertion
    const dbOperations = operations.map(op => {
      return {
        date: op.date,
        description: op.description,
        amount: op.original_amount || op.amount,
        currency: op.original_currency || op.currency,
        amount_pln: op.amount_pln,
        category: op.category || 'Other', // Передаем строковое название категории
        year: parseInt(year),
        month: parseInt(month)
      };
    });

    // Insert operations in batch
    const result = await transactionsQueries.insertBatch(dbOperations);

    if (result.error) {
      console.error('Database insertion failed:', result.error);
      throw new Error(`Database insertion failed: ${result.error.message}`);
    }

    res.json({
      success: true,
      message: `Successfully saved ${result.data ? result.data.length : dbOperations.length} operations for ${year}-${month}`,
      operationsCount: result.data ? result.data.length : dbOperations.length
    });

  } catch (error) {
    console.error('Save operations error:', error);
    
    // Безопасное получение количества операций
    const operationsCount = (operations && Array.isArray(operations)) ? operations.length : 
                           (req.body.operations && Array.isArray(req.body.operations)) ? req.body.operations.length : 0;
    
    // В случае ошибки базы данных в DEV_MODE возвращаем демо-ответ
    if (error.message && (error.message.includes('Invalid API key') || error.message.includes('Database query failed'))) {
      const isLocalhost = req.get('host')?.includes('localhost') || req.get('host')?.includes('127.0.0.1');
      const isDevMode = process.env.DEV_MODE === 'true' || process.env.NODE_ENV === 'development' || isLocalhost;
      
      if (isDevMode) {
        try {
          return res.json({
            success: true,
            message: `[LOCALHOST MODE] Операции не сохранены в базу (Supabase ключ неверный: ${error.message}). Проверьте SUPABASE_SERVICE_KEY в .env файле.`,
            operationsCount: operationsCount,
            demo: true
          });
        } catch (jsonError) {
          console.error('Failed to send demo response:', jsonError);
          return res.status(500).json({
            success: false,
            error: 'Демо режим недоступен'
          });
        }
      } else {
        try {
          return res.status(500).json({
            success: false,
            error: 'База данных недоступна. Проверьте настройки подключения к Supabase.',
            details: error.message
          });
        } catch (jsonError) {
          console.error('Failed to send error response:', jsonError);
        }
      }
    }
    
    // Общая обработка ошибок
    try {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to save operations'
      });
    } catch (responseError) {
      console.error('Failed to send error response:', responseError);
      // Последняя попытка - простой текст
      try {
        res.status(500).send('Internal server error');
      } catch (finalError) {
        console.error('Complete failure to send response:', finalError);
      }
    }
  }
});

module.exports = router;
