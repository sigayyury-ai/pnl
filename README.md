# PNL System

Система для работы с PNL отчетами, мигрированная с WordPress на Node.js для деплоя на Render.

## Возможности

- 📊 Загрузка и анализ CSV файлов
- 🤖 AI категоризация операций через OpenAI
- 💱 Автоматическая конвертация валют в PLN
- 📋 Управление категориями доходов и расходов
- 🔐 Google OAuth авторизация
- 🗄️ Интеграция с Supabase

## Деплой на Render

### Вариант 1: Использование существующего проекта

Если у вас уже есть проект на Render и вы хотите его заменить:

1. Перейдите в Dashboard Render
2. Выберите ваш существующий проект
3. Обновите настройки:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: оставьте пустым

### Вариант 2: Создание нового проекта

1. Подключите ваш GitHub репозиторий к Render
2. Выберите **Web Service**
3. Настройки:
   - **Name**: `pnl-system`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Переменные окружения

Добавьте следующие переменные в настройках Render:

```
SUPABASE_URL=https://fzgajnjtxvkhkfiqkhtb.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
OPENAI_API_KEY=your-openai-api-key
DEMO_MODE=true
NODE_ENV=production
```

## Ограничения бесплатного тарифа Render

- **Сервисы**: Обычно 1-2 сервиса на аккаунт
- **Время работы**: ~750 часов в месяц (достаточно для проектов по надобности)
- **Размер**: До 512MB RAM, 1GB storage
- **Домен**: Один кастомный домен
- **Автоматический сон**: Сервисы засыпают после 15 минут неактивности и просыпаются при запросе (~30 сек cold start)

### Проекты по надобности - идеально для Render!

Ваш случай использования отлично подходит для Render:
- ✅ Сервисы автоматически засыпают при неактивности
- ✅ Экономия ресурсов и времени работы
- ✅ Быстрый старт при обращении

## Локальная разработка

```bash
# Установка зависимостей
npm install

# Запуск в development режиме
npm run dev

# Запуск в production режиме
npm start
```

## API Endpoints

- `POST /api/auth` - Google OAuth авторизация
- `POST /api/analyze-csv` - Загрузка и анализ CSV файлов
- `GET /api/categories` - Получение категорий
- `POST /api/categories` - Добавление категории
- `PUT /api/categories/:type/:id` - Обновление категории
- `DELETE /api/categories/:type/:id` - Удаление категории
- `GET /api/pnl-operations` - Получение операций
- `POST /api/pnl-operations` - Сохранение операции
- `DELETE /api/pnl-operations/:id` - Удаление операции

## Структура проекта

```
├── server.js          # Основной сервер
├── package.json       # Зависимости
├── api/              # API роуты (если нужно разделить)
├── dashboard.html    # Главная страница
├── index.html        # Страница авторизации
├── script.js         # Frontend JavaScript
└── styles.css        # Стили
```
