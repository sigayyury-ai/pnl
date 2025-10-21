# Feature Specification: CSV Bank Processing

**Feature Branch**: `002-csv-bank-processing`  
**Created**: 2025-10-21  
**Status**: Draft  
**Input**: User description: "я хочу загружать файл выгрузки в CSV формате из банка. Обрабатывать платежи которые есть в этом файле. И разносить их на категории доходы и расходы. То есть это PNL отчет о прибылях и убытках компании. Соответственно мне нужно при помощи чата GPT обрабатывать выгрузки. Из революта, из банков польских в CSV формате. Это первичная и самая большая функциональность."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload and Process Bank CSV File (Priority: P1)

Пользователь загружает CSV файл с выгрузкой из банка (Revolut, польские банки) и система автоматически обрабатывает все платежи, категоризируя их на доходы и расходы для создания PNL отчета.

**Why this priority**: Это основная функциональность системы - без неё система не может выполнять свою главную задачу создания PNL отчетов. Это первичная бизнес-ценность.

**Independent Test**: Можно протестировать независимо, загрузив тестовый CSV файл с операциями и проверив, что все платежи корректно обработаны и отнесены к соответствующим категориям.

**Acceptance Scenarios**:

1. **Given** пользователь находится в системе, **When** загружает CSV файл банковской выгрузки, **Then** система обрабатывает все операции и показывает список с автоматическими категориями
2. **Given** файл содержит операции в разных валютах, **When** система обрабатывает файл, **Then** все суммы конвертируются в PLN и корректно отображаются
3. **Given** система не может классифицировать операцию, **When** пользователь просматривает список, **Then** неклассифицированные операции помечены отдельно для ручной категоризации

---

### User Story 2 - AI-Powered Categorization (Priority: P1)

Система использует ChatGPT для автоматической категоризации банковских операций на доходы и расходы, распознавая паттерны и контекст операций.

**Why this priority**: Автоматическая категоризация критически важна для эффективности работы - без неё пользователю придется вручную категоризировать каждую операцию.

**Independent Test**: Можно протестировать с набором операций различного типа и проверить точность автоматической категоризации через ChatGPT.

**Acceptance Scenarios**:

1. **Given** система загрузила CSV с операциями, **When** запускается обработка, **Then** сначала проверяются существующие правила категоризации, затем при необходимости применяется ChatGPT для оставшихся операций
2. **Given** операция соответствует существующему правилу, **When** система проверяет правила, **Then** автоматически применяется категория из правила без использования ChatGPT
3. **Given** ChatGPT не может определить подходящую категорию расхода для операции, **When** анализ завершается, **Then** система автоматически присваивает категорию "Other" для неопределенных расходных операций
4. **Given** ChatGPT API недоступен, **When** система обрабатывает файл, **Then** пользователь видит соответствующие инструкции для ручной категоризации

---

### User Story 3 - Multi-Bank CSV Format Support (Priority: P2)

Система поддерживает различные форматы CSV выгрузок из разных банков (Revolut, польские банки) с автоматическим распознаванием формата.

**Why this priority**: Поддержка разных форматов расширяет функциональность системы и делает её более универсальной, но не критична для MVP.

**Independent Test**: Можно протестировать загрузкой CSV файлов в разных форматах и проверкой корректности распознавания структуры данных.

**Acceptance Scenarios**:

1. **Given** пользователь загружает CSV файл Revolut, **When** система анализирует структуру, **Then** корректно извлекает данные операций согласно формату Revolut
2. **Given** пользователь загружает CSV файл польского банка, **When** система анализирует структуру, **Then** корректно извлекает данные операций согласно формату конкретного банка
3. **Given** формат файла не поддерживается, **When** пользователь загружает файл, **Then** система показывает ошибку с указанием поддерживаемых форматов

---

### User Story 4 - Pre-Upload Category Management and Month Selection (Priority: P1)

Пользователь может просматривать и редактировать результаты AI категоризации перед окончательной загрузкой данных в PNL отчет, выбирая при этом месяц для сохранения операций.

**Why this priority**: Контроль качества данных перед загрузкой критически важен для точности PNL отчетности, а выбор месяца необходим для правильной организации данных по периодам.

**Independent Test**: Можно протестировать независимо, загрузив CSV файл, отредактировав несколько категорий, выбрав месяц и проверив корректность сохранения в базе данных.

**Acceptance Scenarios**:

1. **Given** система завершила AI категоризацию CSV файла, **When** пользователь просматривает результаты, **Then** он может редактировать любую присвоенную категорию или удалить ненужные операции
2. **Given** пользователь готов загрузить обработанные данные, **When** нажимает "Загрузить в отчет", **Then** система требует выбрать год и месяц для сохранения операций в соответствующую PNL таблицу
3. **Given** пользователь выбрал год и месяц и подтвердил загрузку, **When** операция завершается, **Then** все операции сохраняются в базу данных с привязкой к выбранному году и месяцу, а на основе ручных корректировок создаются правила для будущей автоматической категоризации

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept CSV file uploads via web interface
- **FR-002**: System MUST parse CSV files and extract transaction data (amount, date, description, currency)
- **FR-003**: System MUST convert all transaction amounts to PLN using current exchange rates
- **FR-004**: System MUST check existing categorization rules before ChatGPT processing and apply rule-based categorization when patterns match
- **FR-005**: System MUST use ChatGPT API for automatic transaction categorization into income/expense categories with specific subcategories for operations without matching rules
- **FR-006**: System MUST automatically assign "Other" category to expense transactions when ChatGPT cannot determine appropriate subcategory
- **FR-007**: System MUST support CSV formats from Revolut and major Polish banks
- **FR-008**: System MUST handle parsing errors gracefully with clear error messages
- **FR-009**: System MUST preserve original transaction data alongside processed data
- **FR-010**: System MUST display pre-upload review interface allowing users to edit AI-generated categories and delete unwanted transactions
- **FR-011**: System MUST require year and month selection before final data upload to organize transactions by year and month in appropriate PNL table
- **FR-012**: System MUST store processed transactions in database with year and month association for yearly PNL report generation
- **FR-013**: System MUST automatically create categorization rules based on user's manual corrections during upload process

### Key Entities *(include if feature involves data)*

- **Bank Transaction**: Individual financial operation from CSV file with amount, date, description, original currency
- **Processed Transaction**: Bank transaction enriched with PLN amount, category (rule-based or AI-generated), processing metadata, and year-month association
- **Categorization Rule**: Hard-coded mapping between operation description pattern and assigned category used for automatic categorization
- **Other Category**: Default expense category automatically assigned when ChatGPT cannot determine appropriate subcategory
- **Pre-Upload Review**: Interface allowing users to edit categories and delete transactions before final upload, enabling rule creation
- **Year-Month Selection**: User interface for selecting target year and month for transaction storage in appropriate yearly PNL table
- **CSV File**: Bank statement export file containing multiple transactions in structured format

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully upload and process CSV files from supported banks in under 30 seconds
- **SC-002**: System achieves 85%+ accuracy in automatic transaction categorization with rules checked first, then ChatGPT for unmatched operations with "Other" category fallback
- **SC-003**: Currency conversion to PLN is performed with 100% accuracy using current exchange rates
- **SC-004**: System handles CSV parsing errors with clear, actionable error messages in 100% of cases
- **SC-005**: Users can complete entire upload-to-categorization workflow including pre-upload review and year-month selection in under 3 minutes for files with up to 100 transactions
- **SC-006**: Pre-upload review interface allows category editing and transaction deletion with immediate visual feedback in 100% of attempts
- **SC-007**: Year-month selection links transactions to correct yearly PNL table and month column with 100% accuracy
- **SC-008**: System automatically creates categorization rules from user corrections with 100% accuracy for future rule-based categorization

---

## Edge Cases

- What happens when CSV file contains invalid data (malformed dates, non-numeric amounts)?
- How does system handle very large CSV files (1000+ transactions)?
- What occurs when ChatGPT API is temporarily unavailable or rate-limited?
- How does system manage transactions with missing or unclear descriptions?
- What happens when exchange rate API is unavailable during currency conversion?
- What happens when user tries to upload data for a month that already has existing transactions?
- How does system handle pre-upload editing when user deletes all transactions in the review interface?
- What occurs when ChatGPT assigns no category at all (neither specific category nor "Other")?
- What happens when operation description matches multiple rules with different categories?
- How does system handle rule creation when user makes conflicting category choices for similar operations?
- What occurs when rule pattern is too generic and over-matches operations it shouldn't?
