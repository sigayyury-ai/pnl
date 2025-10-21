# Инструкции по деплою на Render

## 🎯 Проект готов для GitHub и Render!

### Структура проекта (очищена и готова к деплою):

```
pnl-system/
├── .gitignore              # Игнорирует node_modules, .env, uploads/
├── .env.example            # Шаблон переменных окружения
├── package.json            # Зависимости и скрипты
├── server.js              # Основной сервер с полным функционалом
├── render.yaml            # Конфигурация для Render
├── README.md              # Документация
├── test-api.js            # Тестирование API
├── index.html             # Страница авторизации
├── dashboard.html         # Главная страница
├── script.js              # Frontend JavaScript
└── styles.css             # Стили
```

## 📋 Следующие шаги:

### 1. Подключение к GitHub репозиторию

Выполните команды в терминале (замените `YOUR_USERNAME` и `YOUR_REPO` на ваши данные):

```bash
cd "/Users/urok/Documents/pnl/plagin dev/pnl-system"

# Подключите ваш GitHub репозиторий
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Загрузите код на GitHub
git push -u origin main
```

### 2. Настройка Render

1. Зайдите в [Render Dashboard](https://dashboard.render.com)
2. Нажмите **"New +"** → **"Web Service"**
3. Подключите ваш GitHub репозиторий
4. Выберите репозиторий `pnl-system`

### 3. Настройки деплоя в Render:

- **Name**: `pnl-system`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Free`

### 4. Переменные окружения в Render:

Добавьте эти переменные в настройках Render:

```
SUPABASE_URL=https://fzgajnjtxvkhkfiqkhtb.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
OPENAI_API_KEY=your-openai-api-key
DEMO_MODE=true
NODE_ENV=production
```

### 5. После деплоя:

Тестирование API:
```bash
# Проверка health endpoint
curl https://your-app.onrender.com/health

# Или используйте тестовый скрипт
npm run test-api https://your-app.onrender.com
```

## ✅ Что готово:

- ✅ Полная миграция функционала из WordPress
- ✅ CSV обработка и AI категоризация
- ✅ Управление категориями
- ✅ Google OAuth авторизация
- ✅ Интеграция с Supabase
- ✅ Оптимизация для Render (sleep/wake)
- ✅ .gitignore настроен правильно
- ✅ Git репозиторий инициализирован

## 🚀 Готово к деплою!
