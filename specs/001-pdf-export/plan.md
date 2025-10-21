# Implementation Plan: PDF Export

**Branch**: `001-pdf-export` | **Date**: 2025-10-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-pdf-export/spec.md`

## Summary

Реализация экспорта PNL данных в PDF формат для месячных отчетов. Используем puppeteer для генерации PDF из HTML шаблона.

## Technical Context

**Language/Version**: Node.js 18+, JavaScript ES6+  
**Primary Dependencies**: puppeteer, express (existing), handlebars (template engine)  
**Storage**: N/A (используем существующую Supabase интеграцию)  
**Testing**: jest для unit тестов, ручное тестирование PDF генерации  
**Target Platform**: Render.com (Linux server)  
**Project Type**: Web application (backend)  
**Performance Goals**: PDF generation under 10 seconds для любого месяца  
**Constraints**: Memory usage under 512MB (Render free tier), puppeteer binary deployment  
**Scale/Scope**: Single user system, occasional PDF generation

## Constitution Check

✅ **User-Centric**: Решает реальную бизнес-задачу экспорта отчетов  
✅ **Spec-Driven**: Основано на детальной спецификации  
✅ **Technical Standards**: Использует Node.js/Express stack  
✅ **Code Quality**: Будет иметь proper error handling  
✅ **Security**: Не нарушает существующую аутентификацию  
✅ **Performance**: Оптимизировано для Render constraints

## Project Structure

### Source Code (repository root)

```
plagin dev/pnl-system/
├── server.js                 # Основной сервер (существующий)
├── package.json              # Добавить puppeteer dependency
├── dashboard.html            # Добавить кнопку Export PDF
├── script.js                 # Добавить клиентскую логику
├── templates/                # Новый каталог
│   └── pdf-template.html     # HTML шаблон для PDF
└── routes/                   # Новый каталог
    └── pdf.js                # PDF generation endpoint
```

**Structure Decision**: Добавляем новый endpoint `/api/export-pdf` и HTML шаблон для генерации PDF. Используем puppeteer для server-side PDF generation.

## Implementation Phases

### Phase 1: Backend PDF Generation
1. Установка puppeteer зависимостей
2. Создание HTML шаблона для PDF
3. Реализация `/api/export-pdf` endpoint в server.js
4. Тестирование базовой PDF генерации

### Phase 2: Frontend Integration  
1. Добавление кнопки "Export PDF" в dashboard
2. Клиентская логика для запроса PDF
3. Обработка loading states и ошибок
4. Интеграционное тестирование

### Phase 3: Styling and Polish
1. CSS стилизация PDF шаблона
2. Добавление логотипа компании
3. Форматирование таблиц PNL данных
4. Финальное тестирование и оптимизация
