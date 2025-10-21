const express = require('express');
const router = express.Router();
const { checkAuth } = require('./auth.js');
const TransactionsQueries = require('../database/queries/transactions.js');
const CategoriesQueries = require('../database/queries/categories.js');

const transactionsQueries = new TransactionsQueries();
const categoriesQueries = new CategoriesQueries();

/**
 * GET /api/pnl
 * Получить PNL данные для выбранного года
 */
router.get('/', checkAuth, async (req, res) => {
  try {
    const { year } = req.query;
    
    if (!year) {
      return res.status(400).json({
        success: false,
        error: 'Year parameter is required'
      });
    }

    console.log(`Loading PNL data for year: ${year}`);

    // Проверяем режим разработки
    const isDevMode = process.env.NODE_ENV === 'development' || 
                     process.env.DEV_MODE === 'true' ||
                     req.get('host')?.includes('localhost');

    if (isDevMode && !process.env.SUPABASE_SERVICE_KEY) {
      console.log('Demo mode: returning mock PNL data');
      return res.json({
        success: true,
        data: {
          categories: [
            { id: '1', name: 'Sales', type: 'income' },
            { id: '2', name: 'Marketing', type: 'expense' },
            { id: '3', name: 'Tools', type: 'expense' }
          ],
          data: {
            'Sales': { 10: 5000.00 },
            'Marketing': { 10: -1500.00 },
            'Tools': { 10: -300.00 }
          },
          year: parseInt(year)
        }
      });
    }

    // Получаем все операции за год
    const operationsResult = await transactionsQueries.getByYear(year);
    if (operationsResult.error) {
      console.error('Error fetching operations:', operationsResult.error);
      return res.status(500).json({
        success: false,
        error: 'Database error while fetching operations'
      });
    }

    // Получаем все категории
    const categoriesResult = await categoriesQueries.selectAll();
    if (categoriesResult.error) {
      console.error('Error fetching categories:', categoriesResult.error);
      // Используем пустой массив если категории недоступны
      categoriesResult.data = [];
    }

    const operations = operationsResult.data || [];
    const categories = categoriesResult.data || [];

    console.log(`Found ${operations.length} operations and ${categories.length} categories for year ${year}`);

    // Агрегируем данные по категориям и месяцам
    const pnlData = {};
    
    // Инициализируем все категории
    categories.forEach(category => {
      if (!pnlData[category.name]) {
        pnlData[category.name] = {};
      }
    });

    // Агрегируем операции
    operations.forEach(operation => {
      const categoryName = operation.category || 'Other';
      const month = operation.month;
      const amount = operation.converted_amount || operation.amount || 0;
      
      // Для маркетинговых данных просто сохраняем значение
      if (operation.type === 'marketing') {
        if (!pnlData[categoryName]) {
          pnlData[categoryName] = {};
        }
        pnlData[categoryName][month] = Math.abs(amount);
        return;
      }
      
      // Определяем тип операции (доход/расход) напрямую из поля type
      const isIncome = operation.type === 'income';
      
      if (!pnlData[categoryName]) {
        pnlData[categoryName] = {};
      }
      
      if (!pnlData[categoryName][month]) {
        pnlData[categoryName][month] = 0;
      }
      
      // Добавляем сумму (положительную для доходов, отрицательную для расходов)
      if (isIncome) {
        pnlData[categoryName][month] += Math.abs(amount);
      } else {
        pnlData[categoryName][month] -= Math.abs(amount);
      }
    });

    // Убираем пустые категории
    Object.keys(pnlData).forEach(categoryName => {
      const months = Object.values(pnlData[categoryName]);
      const hasData = months.some(amount => amount !== 0);
      if (!hasData) {
        delete pnlData[categoryName];
      }
    });

    res.json({
      success: true,
      data: {
        categories: categories,
        data: pnlData,
        year: parseInt(year),
        summary: {
          totalOperations: operations.length,
          categoriesCount: categories.length
        }
      }
    });

  } catch (error) {
    console.error('Error in PNL API:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/pnl/update-cell
 * Обновить значение ячейки в PNL таблице
 */
router.post('/update-cell', async (req, res) => {
  try {
    const { category, month, year, value, type } = req.body;
    
    if (!category || !month || !year || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: category, month, year, value'
      });
    }

    console.log(`Updating PNL cell: ${category} - ${year}-${month} = ${value} (${type})`);

    // Проверяем режим разработки
    const isDevMode = process.env.NODE_ENV === 'development' || 
                     process.env.DEV_MODE === 'true' ||
                     req.get('host')?.includes('localhost');

    if (isDevMode && !process.env.SUPABASE_SERVICE_KEY) {
      console.log('Demo mode: simulating PNL cell update');
      return res.json({
        success: true,
        message: 'Cell updated successfully (demo mode)',
        data: {
          category,
          month: parseInt(month),
          year: parseInt(year),
          value: parseFloat(value),
          type
        }
      });
    }

    // Для маркетинговых категорий не создаем записи в базе данных
    if (type === 'marketing') {
      // Маркетинговые данные сохраняем как специальные операции
      const deleteResult = await transactionsQueries.deleteByCategoryMonthYear(category, month, year);
      if (deleteResult.error) {
        console.error('Error deleting existing marketing data:', deleteResult.error);
      }

      // Если новое значение не равно 0, создаем новую операцию
      if (parseFloat(value) !== 0) {
        const operationData = {
          description: `Marketing metric: ${category}`,
          amount: Math.abs(parseFloat(value)),
          currency: 'PLN',
          converted_amount: Math.abs(parseFloat(value)),
          category: category,
          month: parseInt(month),
          year: parseInt(year),
          type: 'marketing',
          date: new Date().toISOString().split('T')[0]
        };

        const insertResult = await transactionsQueries.insert(operationData);
        if (insertResult.error) {
          console.error('Error inserting marketing data:', insertResult.error);
          return res.status(500).json({
            success: false,
            error: 'Failed to save marketing data'
          });
        }
      }

      return res.json({
        success: true,
        message: 'Marketing data updated successfully',
        data: {
          category,
          month: parseInt(month),
          year: parseInt(year),
          value: parseFloat(value),
          type
        }
      });
    }

    // Находим или создаем категорию для обычных доходов/расходов
    let categoryResult = await categoriesQueries.getByNameAndType(category, type);
    if (categoryResult.error || !categoryResult.data) {
      // Создаем новую категорию
      const createResult = await categoriesQueries.createCategory({
        name: category,
        type: type,
        description: `Auto-created from PNL table edit`
      });
      
      if (createResult.error) {
        console.error('Error creating category:', createResult.error);
        return res.status(500).json({
          success: false,
          error: 'Failed to create category'
        });
      }
      categoryResult = { data: createResult.data };
    }

    const categoryId = categoryResult.data.id;

    // Удаляем существующие операции для этой категории, месяца и года
    // Используем category name вместо ID, так как в таблице operations поле category содержит имя
    const deleteResult = await transactionsQueries.deleteByCategoryMonthYear(category, month, year);
    if (deleteResult.error) {
      console.error('Error deleting existing operations:', deleteResult.error);
    }

    // Если новое значение не равно 0, создаем новую операцию
    if (parseFloat(value) !== 0) {
      const operationData = {
        description: `Manual PNL entry: ${category}`,
        amount: Math.abs(parseFloat(value)),
        currency: 'PLN',
        converted_amount: Math.abs(parseFloat(value)),
        category: category,
        month: parseInt(month),
        year: parseInt(year),
        type: type,
        date: new Date().toISOString().split('T')[0]
      };

      const insertResult = await transactionsQueries.insert(operationData);
      if (insertResult.error) {
        console.error('Error inserting new operation:', insertResult.error);
        return res.status(500).json({
          success: false,
          error: 'Failed to save PNL data'
        });
      }
    }

    res.json({
      success: true,
      message: 'PNL cell updated successfully',
      data: {
        category,
        month: parseInt(month),
        year: parseInt(year),
        value: parseFloat(value),
        type
      }
    });

  } catch (error) {
    console.error('Error updating PNL cell:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
