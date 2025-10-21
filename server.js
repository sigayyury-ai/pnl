// Загружаем переменные окружения
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const Papa = require('papaparse');
const { createClient } = require('@supabase/supabase-js');
const { OAuth2Client } = require('google-auth-library');
const OpenAI = require('openai');
const CurrencyService = require('./services/currencyService.js');

// Import API modules
const authRouter = require('./api/auth.js');
const csvRouter = require('./api/csv.js');
const categoriesRouter = require('./api/categories.js');
const rulesRouter = require('./api/rules.js');
const pnlRouter = require('./api/pnl.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Конфигурация
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '728085463649-jj9dlee9rek2r0k429sh6i6m9ec8582n.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const ALLOWED_EMAILS = process.env.ALLOWED_EMAILS ? process.env.ALLOWED_EMAILS.split(',') : ['hello@comoon.io', 'info@comoon.io'];
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEMO_MODE = process.env.DEMO_MODE === 'true' || true;
// Определяем режим разработки - должно работать одинаково локально и на Render
const DEV_MODE = process.env.NODE_ENV !== 'production' || process.env.DEV_MODE === 'true';

// Логируем режим запуска для отладки
console.log('🔧 Mode configuration:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  DEV_MODE:', DEV_MODE);

// Supabase клиент
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    console.log('✅ Supabase client initialized');
  } else {
    console.warn('⚠️ Supabase credentials not found');
  }
} catch (error) {
  console.error('❌ Failed to initialize Supabase:', error.message);
}

// Google OAuth клиент
let googleClient = null;
try {
  if (GOOGLE_CLIENT_ID) {
    googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
    console.log('✅ Google OAuth client initialized');
  } else {
    console.warn('⚠️ Google Client ID not found');
  }
} catch (error) {
  console.error('❌ Failed to initialize Google OAuth:', error.message);
}

// OpenAI клиент
const openai = OPENAI_API_KEY ? new OpenAI({
  apiKey: OPENAI_API_KEY,
}) : null;

// Currency Service
const currencyService = new CurrencyService();
console.log('✅ Currency Service initialized');

// Создаем папку uploads если её нет (только если не production или если папка доступна)
if (process.env.NODE_ENV !== 'production' && !fs.existsSync('uploads')) {
  try {
    fs.mkdirSync('uploads', { recursive: true });
  } catch (err) {
    console.warn('Could not create uploads directory:', err.message);
  }
}

// Настройка multer для загрузки файлов
const upload = multer({ 
  dest: process.env.NODE_ENV === 'production' ? '/tmp/' : 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Rate limiting middleware for API protection
const rateLimitMap = new Map();

const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10; // max requests per minute
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) { // 1% chance
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  const userLimits = rateLimitMap.get(ip);
  
  if (now > userLimits.resetTime) {
    userLimits.count = 1;
    userLimits.resetTime = now + windowMs;
    return next();
  }
  
  if (userLimits.count >= maxRequests) {
    console.log(`Rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({ 
      error: 'Too many requests', 
      retryAfter: Math.ceil((userLimits.resetTime - now) / 1000)
    });
  }
  
  userLimits.count++;
  next();
};

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://apis.google.com"],
      styleSrcElem: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://apis.google.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://oauth2.googleapis.com", "https://accounts.google.com", "https://apis.google.com"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["https://accounts.google.com", "https://apis.google.com"],
      frameAncestors: ["'none'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: [
    'https://pnl-4ml3.onrender.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS preflight handling
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Apply rate limiting to all API routes
app.use('/api/', rateLimitMiddleware);

// API Routes
app.use('/api/auth', authRouter.router);
app.use('/api/csv', csvRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/rules', rulesRouter);
app.use('/api/pnl', pnlRouter);

// Статические файлы
app.use(express.static(__dirname, {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Функция для проверки Google токена
async function verifyGoogleToken(token) {
  try {
    if (!googleClient) {
      throw new Error('Google OAuth not configured');
    }
    
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (error) {
    throw new Error('Invalid Google token');
  }
}

// Функция для проверки email
function validateEmail(email) {
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}

// Middleware для проверки авторизации (пропускаем в режиме разработки)
function checkAuth(req, res, next) {
  if (DEV_MODE) {
    console.log('DEV_MODE: пропускаем проверку авторизации для', req.method, req.path);
    return next();
  }
  
  console.log('PRODUCTION: проверяем авторизацию для', req.method, req.path);
  // В продакшене проверяем авторизацию
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('PRODUCTION: отсутствует Authorization header');
    return res.status(401).json({ success: false, error: 'Authorization header required' });
  }
  
  next();
}

// API для получения конфигурации Google OAuth
app.get('/api/config', (req, res) => {
  res.json({
    googleClientId: GOOGLE_CLIENT_ID,
    allowedEmails: ALLOWED_EMAILS
  });
});

// API для авторизации
app.post('/api/auth', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }
    
    // Проверяем Google токен
    const userData = await verifyGoogleToken(token);
    
    // Проверяем email
    if (!validateEmail(userData.email)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. Email not in allowed list' 
      });
    }
    
    // Сохраняем пользователя в Supabase
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', userData.email)
      .single();
    
    if (!existingUser) {
      const { data: newUser } = await supabase
        .from('users')
        .insert([{
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
          last_login: new Date().toISOString()
        }])
        .select()
        .single();
    } else {
      // Обновляем время последнего входа
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('email', userData.email);
    }
    
    res.json({
      success: true,
      user: {
        name: userData.name,
        email: userData.email,
        picture: userData.picture
      },
      message: 'Authentication successful'
    });
    
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// API для операций
app.get('/api/operations', checkAuth, async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) {
      return res.status(400).json({ success: false, error: 'Month parameter is required' });
    }
    
    const { data, error } = await supabase
      .from('operations')
      .select('*')
      .eq('month', month);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching operations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch operations' });
  }
});

app.post('/api/operations', checkAuth, async (req, res) => {
  try {
    const { operations, month } = req.body;
    if (!operations || !month) {
      return res.status(400).json({ success: false, error: 'Operations and month are required' });
    }
    
    // Удаляем существующие операции для месяца
    await supabase.from('operations').delete().eq('month', month);
    
    // Добавляем новые операции
    const { data, error } = await supabase
      .from('operations')
      .insert(operations);
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: `${operations.length} operations saved for ${month}`
    });
  } catch (error) {
    console.error('Error saving operations:', error);
    res.status(500).json({ success: false, error: 'Failed to save operations' });
  }
});

// API для PNL данных
app.get('/api/pnl', checkAuth, async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) {
      return res.status(400).json({ success: false, error: 'Month parameter is required' });
    }
    
    const { data, error } = await supabase
      .from('pnl_data')
      .select('*')
      .eq('month', month);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching PNL data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch PNL data' });
  }
});

app.post('/api/pnl', checkAuth, async (req, res) => {
  try {
    const { pnl_data, month } = req.body;
    if (!pnl_data || !month) {
      return res.status(400).json({ success: false, error: 'PNL data and month are required' });
    }
    
    // Удаляем существующие PNL данные для месяца
    await supabase.from('pnl_data').delete().eq('month', month);
    
    // Добавляем новые PNL данные
    const { data, error } = await supabase
      .from('pnl_data')
      .insert(pnl_data);
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: `PNL data saved for ${month}`
    });
  } catch (error) {
    console.error('Error saving PNL data:', error);
    res.status(500).json({ success: false, error: 'Failed to save PNL data' });
  }
});

// Вспомогательные функции для работы с категориями
async function getCategories() {
  try {
    if (!supabase) {
      console.warn('Supabase not initialized, returning empty categories');
      return { income: [], expense: [] };
    }
    
    const [incomeResult, expenseResult] = await Promise.all([
      supabase.from('pnl_income_categories').select('*').order('name'),
      supabase.from('pnl_expense_categories').select('*').order('name')
    ]);

    return {
      income: incomeResult.data || [],
      expense: expenseResult.data || []
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { income: [], expense: [] };
  }
}

// Функция парсинга CSV файла
function parseCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const operations = [];
    const headers = [];
    let isFirstRow = true;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('headers', (headerList) => {
        headers.push(...headerList.map(h => h.toLowerCase().trim()));
      })
      .on('data', (row) => {
        if (isFirstRow) {
          isFirstRow = false;
        }

        const operation = {};
        
        Object.keys(row).forEach(key => {
          const lowerKey = key.toLowerCase().trim();
          const value = row[key]?.trim();
          
          switch (lowerKey) {
            case 'data':
            case 'date':
            case 'date completed (utc)':
            case 'date started (utc)':
            case 'transaction date':
            case 'data transakcji':
              operation.date = parseDate(value);
              break;
            case 'opis':
            case 'description':
            case 'opis operacji':
            case 'transaction description':
              operation.description = value;
              break;
            case 'kwota':
            case 'amount':
            case 'suma':
            case 'transaction amount':
              operation.amount = value;
              break;
            case 'waluta':
            case 'currency':
            case 'payment currency':
            case 'transaction currency':
              operation.currency = value?.toUpperCase();
              break;
            case 'typ':
            case 'type':
            case 'transaction type':
              operation.type = value;
              break;
          }
        });

        operation.raw_data = row;

        if (operation.description && operation.amount) {
          operations.push(operation);
        }
      })
      .on('end', () => {
        resolve(operations);
      })
      .on('error', reject);
  });
}

function parseDate(dateString) {
  if (!dateString) return '';
  
  const formats = [
    'YYYY-MM-DD HH:mm:ss',
    'YYYY-MM-DD',
    'DD.MM.YYYY',
    'DD/MM/YYYY',
    'MM/DD/YYYY'
  ];
  
  for (const format of formats) {
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      continue;
    }
  }
  
  return '';
}

// Currency exchange rates now handled by CurrencyService
// Removed duplicate getExchangeRates function to avoid multiple API calls

// Enhanced currency conversion using CurrencyService
async function convertCurrenciesToPLN(operations) {
  try {
    // Extract unique currencies from operations
    const currencies = [...new Set(operations.map(op => op.currency?.toUpperCase()).filter(Boolean))];
    
    console.log(`Converting currencies: ${currencies.join(', ')}`);
    
    // Get exchange rates using our CurrencyService
    const exchangeRates = await currencyService.getExchangeRates(currencies);
    
    console.log('Exchange rates obtained:', exchangeRates);
    
    // Convert operations using CurrencyService
    const convertedOperations = currencyService.convertOperationsToPLN(operations, exchangeRates);
    
    // Add operation type determination
    const finalOperations = convertedOperations.map(operation => ({
      ...operation,
      operation_type: (parseFloat(operation.amount?.replace(',', '.')) || 0) >= 0 ? 'income' : 'expense'
    }));
    
    return {
      success: true,
      operations: finalOperations,
      exchange_rates: exchangeRates,
      currencies_found: currencies,
      conversion_timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Currency conversion error:', error);
    
    // Fallback to simple conversion without API
    return {
      success: false,
      operations: operations.map(op => ({
        ...op,
        amount_pln: Math.abs(parseFloat(op.amount?.replace(',', '.')) || 0),
        operation_type: (parseFloat(op.amount?.replace(',', '.')) || 0) >= 0 ? 'income' : 'expense',
        exchange_rate: 1.0,
        original_currency: op.currency?.toUpperCase() || 'PLN'
      })),
      currencies_found: [...new Set(operations.map(op => op.currency?.toUpperCase()).filter(Boolean))],
      error: error.message
    };
  }
}

// Функция категоризации операций
async function categorizeOperations(operations) {
  if (DEMO_MODE) {
    return demoCategorizeOperations(operations);
  } else {
    return await chatGPTCategorizeOperations(operations);
  }
}

function demoCategorizeOperations(operations) {
  const categorized = operations.map(operation => {
    const category = assignCategory(operation.description, operation.operation_type);
    return { ...operation, category };
  });
  
  return { success: true, operations: categorized };
}

async function chatGPTCategorizeOperations(operations) {
  try {
    if (!openai) {
      console.log('OpenAI not configured, falling back to demo mode');
      return demoCategorizeOperations(operations);
    }
    
    const categories = await getCategories();
    
    const prompt = buildCategorizationPrompt(operations, categories);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Ты эксперт по финансам польской компании. Анализируй операции и присваивай категории.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });
    
    const chatGPTResponse = response.choices[0].message.content;
    return parseChatGPTResponse(operations, chatGPTResponse);
    
  } catch (error) {
    console.error('ChatGPT categorization error:', error);
    return demoCategorizeOperations(operations);
  }
}

function buildCategorizationPrompt(operations, categories) {
  const operationsText = operations.map((op, index) => 
    `${index + 1}. ${op.description} - ${op.amount_pln} PLN (${op.operation_type})`
  ).join('\n');
  
  let prompt = `Проанализируй следующие финансовые операции польской компании и присвой каждой подходящую категорию.\n\n`;
  prompt += `ОПЕРАЦИИ:\n${operationsText}\n\n`;
  
  prompt += `ДОСТУПНЫЕ КАТЕГОРИИ:\n\n`;
  prompt += `ДОХОДЫ:\n`;
  categories.income.forEach(cat => {
    prompt += `- ${cat.name} (${cat.description || cat.name})\n`;
  });
  
  prompt += `\nРАСХОДЫ:\n`;
  categories.expense.forEach(cat => {
    prompt += `- ${cat.name} (${cat.description || cat.name})\n`;
  });
  
  prompt += `\nВерни ТОЛЬКО JSON в формате:\n`;
  prompt += `[{"operation": 1, "category": "Sales Revenue"}, {"operation": 2, "category": "Marketing & Advertising"}]`;
  
  return prompt;
}

function parseChatGPTResponse(operations, response) {
  try {
    const jsonStart = response.indexOf('[');
    const jsonEnd = response.lastIndexOf(']');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No JSON found in response');
    }
    
    const jsonString = response.substring(jsonStart, jsonEnd + 1);
    const categories = JSON.parse(jsonString);
    
    const categorized = operations.map((operation, index) => {
      const categoryAssignment = categories.find(c => c.operation === index + 1);
      const category = categoryAssignment?.category || assignCategory(operation.description, operation.operation_type);
      
      return { ...operation, category };
    });
    
    return { success: true, operations: categorized };
    
  } catch (error) {
    console.error('Error parsing ChatGPT response:', error);
    return demoCategorizeOperations(operations);
  }
}

function assignCategory(description, type) {
  const desc = description.toLowerCase();
  
  if (type === 'income') {
    if (desc.includes('sale') || desc.includes('revenue')) return 'Sales Revenue';
    if (desc.includes('consult')) return 'Consulting Revenue';
    if (desc.includes('affiliate')) return 'Affiliate Revenue';
    return 'Other Income';
  } else {
    if (desc.includes('hotel') && desc.includes('booking')) return 'Cost of house';
    if (desc.includes('facebk') || desc.includes('facebook')) return 'Paid ads';
    if (desc.includes('marketing') || desc.includes('ads')) return 'Marketing & Advertising';
    if (desc.includes('office')) return 'Office & Equipment';
    if (desc.includes('software') || desc.includes('subscription')) return 'Software & Tools';
    if (desc.includes('travel')) return 'Travel & Transportation';
    if (desc.includes('service')) return 'Professional Services';
    return 'Other Expenses';
  }
}

// Old CSV endpoint removed - now using modular /api/csv/analyze-csv

// Old categories endpoints removed - now using modular /api/categories/*

// API для сохранения операций (исправленная версия)
app.post('/api/pnl-operations', checkAuth, async (req, res) => {
  try {
    const { operation } = req.body;
    
    if (!operation) {
      return res.status(400).json({ success: false, error: 'Operation data is required' });
    }
    
    const operationData = {
      user_id: 1, // TODO: Get from auth
      description: operation.description,
      amount: parseFloat(operation.amount_pln) || 0,
      category: operation.category,
      date: operation.date || new Date().toISOString().split('T')[0]
    };
    
    const { data, error } = await supabase
      .from('pnl_operations')
      .insert([operationData])
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, operation: data });
    
  } catch (error) {
    console.error('Error saving operation:', error);
    res.status(500).json({ success: false, error: 'Failed to save operation' });
  }
});

// API для удаления операции
app.delete('/api/pnl-operations/:id', checkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('pnl_operations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.json({ success: true, message: 'Operation deleted' });
    
  } catch (error) {
    console.error('Error deleting operation:', error);
    res.status(500).json({ success: false, error: 'Failed to delete operation' });
  }
});

// API для получения операций по месяцу (исправленная версия)
app.get('/api/pnl-operations', checkAuth, async (req, res) => {
  try {
    const { month } = req.query;
    
    let query = supabase.from('pnl_operations').select('*').order('created_at', { ascending: false });
    
    if (month) {
      // Фильтруем по месяцу в дате
      query = query.gte('date', `${month}-01`).lt('date', `${month}-32`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json(data || []);
    
  } catch (error) {
    console.error('Error fetching operations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch operations' });
  }
});

// Явные маршруты для статических файлов
app.get('/styles.css', (req, res) => {
  res.setHeader('Content-Type', 'text/css');
  res.sendFile(path.join(__dirname, 'styles.css'));
});

app.get('/script.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'script.js'));
});

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Dashboard страница
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// Health check endpoint для быстрого пробуждения
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    rateLimiting: 'active',
    compliance: 'render-compliant'
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 PNL System server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💤 Server optimized for Render's sleep/wake cycles`);
});

module.exports = app;