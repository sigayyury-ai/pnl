# Feature Specification: Categorization Rules Management

**Feature Branch**: `006-categorization-rules`  
**Created**: 2025-10-21  
**Status**: Draft  
**Input**: User description: "также я хочу иметь в настройках секцию правила, это такой hard-code, можно сказать, которые четко привязывают платеж из CSV-файла к какой-то конкретной категории. И запоминает этот выбор, и при следующих появлениях такого же платежа автоматически произойдет настройка категории. Так же правила создаются при первой загрузке файла и хранятся в настройках, и используются каждый раз при следующих загрузках. Правила можно удалять и редактировать. То есть это такие получается хардкод правила, которыми можно управлять потом распределение по категориям."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Rule Creation from First Upload (Priority: P1)

При первой загрузке CSV файла система автоматически создает правила категоризации на основе пользовательских решений и сохраняет их в настройках для последующего использования.

**Why this priority**: Автоматическое создание правил критично для повышения эффективности обработки последующих файлов и снижения ручного труда пользователя.

**Independent Test**: Можно протестировать независимо, загрузив первый CSV файл, отредактировав несколько категорий и проверив, что соответствующие правила созданы и сохранены в настройках.

**Acceptance Scenarios**:

1. **Given** пользователь загружает первый CSV файл и вручную корректирует категории операций, **When** завершает загрузку, **Then** система автоматически создает правила на основе этих корректировок и сохраняет их в настройках
2. **Given** пользователь изменил категорию операции с "Other" на "Продукты питания", **When** система создает правило, **Then** правило связывает описание операции с категорией "Продукты питания" для будущих совпадений
3. **Given** пользователь удалил ненужную операцию перед загрузкой, **When** система обрабатывает это, **Then** создается правило для исключения подобных операций в будущем

---

### User Story 2 - Rule-Based Automatic Categorization (Priority: P1)

При загрузке последующих CSV файлов система использует сохраненные правила для автоматического назначения категорий, проверяя соответствие описаний операций с существующими правилами.

**Why this priority**: Это основная ценность системы правил - автоматизация повторяющихся решений и обеспечение консистентности категоризации между файлами.

**Independent Test**: Можно протестировать независимо, загрузив второй CSV файл с операциями, похожими на те, для которых уже созданы правила, и проверив автоматическое применение правил.

**Acceptance Scenarios**:

1. **Given** в настройках существуют правила категоризации, **When** пользователь загружает новый CSV файл, **Then** система проверяет каждую операцию против правил и автоматически применяет соответствующие категории
2. **Given** операция в новом файле точно соответствует описанию из существующего правила, **When** система обрабатывает операцию, **Then** автоматически назначается категория из правила без участия ChatGPT
3. **Given** операция частично соответствует правилу, **When** система анализирует совпадение, **Then** применяется правило и операция помечается как обработанная по правилу

---

### User Story 3 - Manual Rule Management (Priority: P1)

Пользователь может управлять правилами категоризации в настройках: просматривать существующие правила, редактировать их, создавать новые и удалять ненужные.

**Why this priority**: Ручное управление правилами необходимо для точной настройки системы под бизнес-потребности и исправления автоматически созданных правил.

**Independent Test**: Можно протестировать независимо, открыв раздел "Правила" в настройках и проверив все CRUD операции над правилами.

**Acceptance Scenarios**:

1. **Given** пользователь находится в разделе "Правила" настроек, **When** просматривает список существующих правил, **Then** видит все правила с указанием описания операции, назначенной категории и даты создания
2. **Given** пользователь выбирает правило для редактирования, **When** изменяет категорию или описание, **Then** изменения сохраняются и применяются к будущим операциям
3. **Given** пользователь хочет создать новое правило, **When** добавляет правило с описанием операции и категорией, **Then** правило сохраняется и становится доступным для автоматического применения
4. **Given** пользователь удаляет правило, **When** подтверждает удаление, **Then** правило удаляется из настроек и больше не применяется к новым операциям

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically create categorization rules based on user's manual category corrections during first CSV file upload
- **FR-002**: System MUST store rules permanently in settings with operation description pattern and assigned category mapping
- **FR-003**: System MUST apply existing rules during subsequent CSV file uploads before ChatGPT processing
- **FR-004**: System MUST match operation descriptions against rule patterns and automatically assign categories when matches found
- **FR-005**: System MUST provide rule management interface allowing users to view, create, edit, and delete categorization rules
- **FR-006**: System MUST support pattern matching for rule application (exact match, partial match, keyword matching)
- **FR-007**: System MUST allow rule priority handling when multiple rules could apply to same operation
- **FR-008**: System MUST preserve rule creation timestamp and usage statistics for rule management
- **FR-009**: System MUST handle rule conflicts gracefully with clear indication of which rule was applied

### Key Entities *(include if feature involves data)*

- **Categorization Rule**: Hard-coded mapping between operation description pattern and assigned category with metadata
- **Rule Pattern**: Specific description or pattern that triggers rule application for transaction categorization
- **Rule Settings**: Persistent storage of all categorization rules available for automatic application
- **Rule Match**: Instance where operation description matches existing rule pattern resulting in automatic categorization

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: System automatically creates rules from user corrections during first upload with 100% accuracy
- **SC-002**: Rule-based categorization applies to 90%+ of matching operations in subsequent file uploads
- **SC-003**: Users can complete full rule management operations (create/edit/delete) with 100% success rate
- **SC-004**: Rule application reduces ChatGPT processing time by 50%+ for operations with existing rules
- **SC-005**: System maintains rule consistency across multiple file uploads with zero rule conflicts

---

## Edge Cases

- What happens when operation description partially matches multiple rules?
- How does system handle rule deletion when rules have been applied to historical transactions?
- What occurs when ChatGPT suggests different category than existing rule for same operation type?
- How does system manage rule updates when category names change in category management?
- What happens when very similar but not identical operation descriptions exist across different rules?
- How does system handle rule creation with very generic patterns that might over-match?
