# Feature Specification: Category Management System

**Feature Branch**: `004-category-management`  
**Created**: 2025-10-21  
**Status**: Draft  
**Input**: User description: "я и хочу иметь возможность настраивать категории, по которым будет распределяться платежи и выгрузка из CSV. То есть мне нужно ручное управление, а также автоматическое управление при помощи обработки в чате GPT. Соответственно, при первой загрузке файла чат GPT определяет категории, которые там есть. Сохраняет их в настройке. В настройках есть возможность редактировать сохраненные категории, также добавлять новые или удалять. И после этого при уже других загрузках ксв файлов платежи будут распределяться по тем категориям, которые есть в настройках."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initial Category Discovery via ChatGPT (Priority: P1)

При первой загрузке CSV файла система использует ChatGPT для анализа операций и автоматически определяет возможные категории доходов и расходов, сохраняя их в настройки системы для дальнейшего использования.

**Why this priority**: Это основа для всех последующих операций категоризации - без начального определения категорий система не сможет эффективно распределять платежи.

**Independent Test**: Можно протестировать независимо, загрузив первый CSV файл и проверив, что ChatGPT корректно определил и сохранил релевантные категории в систему.

**Acceptance Scenarios**:

1. **Given** пользователь загружает первый CSV файл с банковскими операциями, **When** система обрабатывает файл через ChatGPT, **Then** ChatGPT анализирует операции и определяет список категорий доходов и расходов
2. **Given** ChatGPT определил категории из CSV файла, **When** обработка завершается, **Then** система сохраняет эти категории в настройки и показывает их пользователю для подтверждения
3. **Given** система определила категории, **When** пользователь просматривает настройки, **Then** все новые категории отображаются с возможностью редактирования

---

### User Story 2 - Manual Category Management (Priority: P1)

Пользователь может вручную управлять категориями в настройках системы: добавлять новые, редактировать существующие, удалять ненужные категории для точной настройки под свои бизнес-потребности.

**Why this priority**: Ручное управление критично для адаптации системы под конкретные бизнес-процессы пользователя, так как автоматически определенные категории могут не полностью соответствовать потребностям.

**Independent Test**: Можно протестировать независимо, зайдя в настройки категорий и проверив все операции CRUD (создание, редактирование, удаление) категорий.

**Acceptance Scenarios**:

1. **Given** пользователь находится в настройках категорий, **When** нажимает "Добавить категорию", **Then** может ввести название, тип (доход/расход) и сохранить новую категорию
2. **Given** пользователь просматривает список существующих категорий, **When** кликает на категорию для редактирования, **Then** может изменить название, тип или описание категории
3. **Given** пользователь хочет удалить категорию, **When** выбирает категорию без связанных операций, **Then** система удаляет категорию с подтверждением

---

### User Story 3 - CSV Processing with Existing Categories (Priority: P1)

При загрузке последующих CSV файлов система использует уже сохранённые в настройках категории для автоматической категоризации операций, обеспечивая консистентность и предсказуемость распределения платежей.

**Why this priority**: Это основная функциональность для поддержания консистентности данных и эффективной обработки множественных файлов.

**Independent Test**: Можно протестировать независимо, загрузив второй CSV файл после настройки категорий и проверив, что операции корректно распределяются по существующим категориям.

**Acceptance Scenarios**:

1. **Given** в системе уже настроены категории, **When** пользователь загружает новый CSV файл, **Then** система распределяет операции только по существующим категориям из настроек
2. **Given** система встречает операцию, которая не подходит под существующие категории, **When** завершается обработка CSV, **Then** такие операции помечаются как "требующие категоризации" для ручной обработки
3. **Given** операция может подходить под несколько категорий, **When** система обрабатывает через ChatGPT, **Then** выбирается наиболее подходящая категория с возможностью ручной коррекции

---

### User Story 4 - Income and Expense Category Management (Priority: P1)

Пользователь может управлять как категориями расходов, так и категориями доходов (приходов) в едином интерфейсе настроек, с возможностью добавления новых категорий каждого типа и их автоматического отображения в PNL таблице.

**Why this priority**: Поддержка категорий доходов критично для полноценной PNL отчётности, так как прибыль рассчитывается как разность доходов и расходов.

**Independent Test**: Можно протестировать независимо, создав категории доходов в настройках и проверив их отображение в соответствующем разделе PNL таблицы.

**Acceptance Scenarios**:

1. **Given** пользователь находится в настройках категорий, **When** добавляет новую категорию с типом "доход", **Then** категория сохраняется и становится доступной для использования в CSV обработке
2. **Given** в системе настроены категории доходов и расходов, **When** пользователь открывает PNL таблицу, **Then** все категории автоматически отображаются в соответствующих разделах (доходы/расходы)
3. **Given** пользователь создал новую категорию дохода, **When** загружает CSV файл с приходными операциями, **Then** система может использовать новую категорию для автоматической категоризации

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST use ChatGPT to analyze CSV operations and automatically determine relevant income and expense categories on first file upload
- **FR-002**: System MUST save automatically discovered categories to persistent settings for future use
- **FR-003**: System MUST provide category management interface allowing users to view, add, edit, and delete categories
- **FR-004**: System MUST enforce category type validation (income vs expense) when creating or editing categories
- **FR-005**: System MUST prevent deletion of categories that have associated transactions
- **FR-006**: System MUST use existing saved categories for categorizing operations in subsequent CSV file uploads
- **FR-007**: System MUST handle operations that don't match any existing categories by flagging them for manual review
- **FR-008**: System MUST allow users to manually assign flagged operations to existing categories or create new categories on-demand
- **FR-009**: System MUST maintain category consistency across all CSV processing sessions
- **FR-010**: System MUST support both income and expense category types with equal functionality in management interface
- **FR-011**: System MUST automatically display all configured categories in appropriate sections of PNL table (income/expense sections)
- **FR-012**: System MUST allow manual creation of income categories independently of CSV processing
- **FR-013**: System MUST ensure newly created income categories immediately become available for CSV operation categorization

### Key Entities *(include if feature involves data)*

- **Category**: Individual classification for transactions with name, type (income/expense), and optional description
- **Income Category**: Category specifically designated for income/credit operations with automatic display in PNL income section
- **Expense Category**: Category specifically designated for expense/debit operations with automatic display in PNL expense section
- **Category Settings**: Persistent storage of all configured categories (both income and expense) available for CSV processing
- **Uncategorized Transaction**: Bank operation that doesn't match any existing category and requires manual assignment

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: ChatGPT successfully identifies and saves relevant categories from initial CSV file within 60 seconds
- **SC-002**: Users can complete full category management operations (add/edit/delete) with 100% success rate
- **SC-003**: System maintains zero data loss when managing categories with existing transaction associations
- **SC-004**: Subsequent CSV files are processed using saved categories with 90%+ automatic categorization accuracy
- **SC-005**: Manual category assignment for flagged operations completes successfully in under 30 seconds per operation
- **SC-006**: Income categories created manually appear in PNL table income section within 5 seconds of creation
- **SC-007**: Both income and expense categories maintain equal functionality in management interface with 100% feature parity
- **SC-008**: Newly created income categories become immediately available for CSV processing with zero configuration delay

---

## Edge Cases

- What happens when ChatGPT suggests categories that conflict with user's business needs?
- How does system handle deletion attempts on categories with associated transactions?
- What occurs when CSV contains operations in currencies not previously encountered?
- How does system manage very large numbers of categories (100+ categories)?
- What happens when ChatGPT is unavailable during initial category discovery?
- How does system handle mixed income/expense categories or categories with ambiguous type determination?
- What occurs when user tries to change category type from income to expense (or vice versa) for categories with existing transactions?
- How does system ensure PNL table properly reflects newly added income categories without manual refresh?
