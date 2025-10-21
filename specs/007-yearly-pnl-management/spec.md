# Feature Specification: Yearly PNL Management

**Feature Branch**: `007-yearly-pnl-management`  
**Created**: 2025-10-21  
**Status**: Draft  
**Input**: User description: "так, и еще одна спецификация, так как отчет у нас годовой P&L, то должна быть возможность перехода на следующий год. Сейчас мы делаем все для 2025 года, но должна быть возможность создавать еще и следующие года. То есть каждый раз при создании года у тебя генерируется табличка, в которую заносятся все результаты обработки. То есть получается даже при загрузке файла первичный надо выбирать не только месяц, но и год. Либо возможно ты сразу открываешь год, а тебе останется только выбрать месяц."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Year Selection and Creation (Priority: P1)

Пользователь может выбирать между существующими годами PNL отчетов или создавать новый год, при создании которого автоматически генерируется пустая таблица PNL с 12 месяцами для будущего заполнения данными.

**Why this priority**: Возможность работы с несколькими годами критично для реального использования системы в бизнесе, где требуется вести историческую отчетность и планирование на будущее.

**Independent Test**: Можно протестировать независимо, создав новый год (например, 2026) и проверив, что система генерирует корректную пустую PNL таблицу с 12 месячными колонками.

**Acceptance Scenarios**:

1. **Given** пользователь находится в системе, **When** нажимает на селектор года, **Then** видит список доступных годов (например, 2025, 2026) с возможностью создания нового года
2. **Given** пользователь выбирает "Создать новый год", **When** вводит год (например, 2027), **Then** система создает новую пустую PNL таблицу для выбранного года с 12 месячными колонками
3. **Given** пользователь переключается между существующими годами, **When** выбирает другой год, **Then** система отображает PNL таблицу с данными для выбранного года

---

### User Story 2 - Year-Month Selection During CSV Upload (Priority: P1)

При загрузке CSV файла пользователь должен выбрать как год, так и месяц для сохранения операций, обеспечивая правильную организацию данных в соответствующей таблице.

**Why this priority**: Выбор года критичен для корректной организации финансовых данных и предотвращения смешивания данных между годами, что может привести к неверным отчетам.

**Independent Test**: Можно протестировать независимо, загрузив CSV файл и проверив, что операции сохраняются именно в выбранный год и месяц в соответствующей PNL таблице.

**Acceptance Scenarios**:

1. **Given** пользователь загружает CSV файл и проходит предварительный просмотр, **When** нажимает "Загрузить в отчет", **Then** система запрашивает выбор года и месяца для сохранения операций
2. **Given** пользователь выбирает год 2025 и месяц Март, **When** подтверждает загрузку, **Then** все операции сохраняются в таблицу 2025 года в колонку "Март"
3. **Given** пользователь выбирает новосозданный год 2026, **When** выбирает любой месяц, **Then** система создает записи в соответствующем месте новой таблицы 2026 года

---

### User Story 3 - Contextual Year-Based Interface (Priority: P2)

Пользователь может сразу открыть нужный год в системе, после чего интерфейс показывает только выбор месяца для загрузки файлов, упрощая навигацию после выбора года.

**Why this priority**: Упрощение workflow после выбора года повышает удобство использования, особенно при работе с одним годом в течение длительного времени.

**Independent Test**: Можно протестировать независимо, выбрав конкретный год и проверив, что все интерфейсы (загрузка файлов, PNL таблица) работают в контексте выбранного года.

**Acceptance Scenarios**:

1. **Given** пользователь выбрал год 2025, **When** открывает интерфейс загрузки CSV, **Then** система показывает только выбор месяца, так как год уже определен
2. **Given** пользователь находится в контексте года 2025, **When** просматривает PNL таблицу, **Then** система отображает только данные за 2025 год
3. **Given** пользователь хочет переключиться на другой год, **When** использует селектор года, **Then** может легко переключиться с сохранением текущего прогресса

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide year selector interface allowing users to choose existing years or create new year entries
- **FR-002**: System MUST automatically generate empty PNL table with 12 monthly columns when new year is created
- **FR-003**: System MUST require both year and month selection during CSV file upload process before data storage
- **FR-004**: System MUST store transactions with year and month association for proper data organization across multiple years
- **FR-005**: System MUST display PNL table data filtered by selected year context
- **FR-006**: System MUST maintain separate data isolation between different years to prevent data mixing
- **FR-007**: System MUST allow switching between years with preservation of current session state and progress
- **FR-008**: System MUST provide contextual interface where year selection determines available month options for CSV uploads
- **FR-009**: System MUST validate year input (reasonable range, no duplicates) when creating new year entries

### Key Entities *(include if feature involves data)*

- **Year**: Individual year entry containing complete 12-month PNL table structure for financial reporting
- **Yearly PNL Table**: Complete PNL table with 12 monthly columns (January-December) for specific year
- **Year-Month Association**: Database relationship linking transactions to specific year and month combination
- **Year Context**: Current active year interface state determining data display and input options

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create new year entries and generate PNL tables within 5 seconds of year creation
- **SC-002**: Year selection and switching completes within 2 seconds with immediate interface updates
- **SC-003**: CSV upload with year-month selection maintains 100% data accuracy for year-specific storage
- **SC-004**: System maintains complete data isolation between years with zero cross-year data contamination
- **SC-005**: Users can complete year selection and CSV upload workflow in under 1 minute for experienced users

---

## Edge Cases

- What happens when user tries to create a year that already exists?
- How does system handle year switching when user has unsaved changes in current year?
- What occurs when user uploads CSV for year that doesn't exist yet?
- How does system manage storage limitations when supporting many years of data?
- What happens when user accidentally selects wrong year during CSV upload?
- How does system handle year-based data migration or backup scenarios?
