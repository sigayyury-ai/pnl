# Feature Specification: Editable PNL Table

**Feature Branch**: `003-editable-pnl-table`  
**Created**: 2025-10-21  
**Status**: Draft  
**Input**: User description: "также этот таблицу pnl-отчет который сделался после загрузки файлов я хочу иметь возможность редактировать руками за исключением тех ячеек где высчитываются формулы то есть должна быть автоматическая возможность автоматической загрузки и подставления данных из файлов к sv а также должна быть мануальная возможность изменять данные в табличке pnl"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Auto-populate PNL Table from CSV Data (Priority: P1)

После обработки CSV файлов система автоматически заполняет PNL таблицу данными из обработанных банковских операций, распределяя суммы по соответствующим категориям доходов и расходов.

**Why this priority**: Автоматическое заполнение таблицы - основная ценность после обработки CSV файлов. Без этого пользователю пришлось бы вручную переносить все данные.

**Independent Test**: Можно протестировать независимо, загрузив CSV файл и проверив, что PNL таблица автоматически заполнилась корректными суммами по категориям.

**Acceptance Scenarios**:

1. **Given** пользователь обработал CSV файл с банковскими операциями, **When** открывает PNL таблицу, **Then** таблица автоматически заполнена суммами по соответствующим категориям доходов и расходов
2. **Given** система обработала операции с разными категориями, **When** пользователь просматривает PNL таблицу, **Then** все категории содержат корректные суммы в PLN
3. **Given** пользователь обработал несколько CSV файлов за период, **When** открывает PNL таблицу, **Then** суммы по категориям суммируются корректно

---

### User Story 2 - Manual Edit PNL Table Values (Priority: P1)

Пользователь может вручную редактировать значения в PNL таблице для корректировок, уточнений или добавления данных, которые не были в CSV файлах, с защитой формульных ячеек от изменений.

**Why this priority**: Ручное редактирование критично для полноты и точности PNL отчетов, так как не все данные могут быть в банковских выгрузках.

**Independent Test**: Можно протестировать независимо, открыв PNL таблицу и попытавшись редактировать разные ячейки - редактируемые должны изменяться, формульные должны быть защищены.

**Acceptance Scenarios**:

1. **Given** пользователь открыл PNL таблицу, **When** кликает на ячейку с суммой категории, **Then** может редактировать значение с сохранением изменений
2. **Given** пользователь пытается редактировать ячейку с формулой (итоги, суммы), **When** кликает на неё, **Then** ячейка защищена от изменений с визуальным указанием
3. **Given** пользователь внёс изменения в ячейку, **When** нажимает Enter или кликает вне ячейки, **Then** изменения сохраняются и формульные ячейки пересчитываются автоматически

---

### User Story 3 - Formula-protected Auto-calculation (Priority: P2)

Система автоматически пересчитывает формулы в PNL таблице при изменении данных, защищая формульные ячейки от ручного редактирования и обеспечивая корректность итоговых значений.

**Why this priority**: Автоматический пересчёт обеспечивает целостность данных и исключает ошибки в расчётах, но не критичен для MVP.

**Independent Test**: Можно протестировать, изменив несколько значений в таблице и проверив корректность автоматического пересчёта формул.

**Acceptance Scenarios**:

1. **Given** пользователь изменил значение в редактируемой ячейке, **When** завершает редактирование, **Then** все зависимые формулы пересчитываются автоматически
2. **Given** пользователь пытается изменить ячейку с формулой итогов, **When** начинает редактирование, **Then** система показывает предупреждение о защищённой ячейке
3. **Given** таблица содержит ошибки в расчётах, **When** пользователь открывает таблицу, **Then** система показывает предупреждение о некорректных формулах

---

### User Story 4 - Marketing Metrics Integration (Priority: P1)

Пользователь видит в PNL таблице отдельную маркетинговую секцию с полями для ручного ввода маркетинговых метрик (количество лидов, сделок, расходы на рекламу, конверсия, стоимость лида и сделки), которая работает независимо от месячных финансовых данных.

**Why this priority**: Маркетинговые метрики критично важны для комплексного анализа бизнес-результатов, но требуют отдельного отслеживания от финансовых операций по месяцам.

**Independent Test**: Можно протестировать независимо, открыв PNL таблицу, найдя маркетинговую секцию и проверив возможность ввода и сохранения маркетинговых данных.

**Acceptance Scenarios**:

1. **Given** пользователь открывает PNL таблицу, **When** просматривает всю таблицу, **Then** видит маркетинговую секцию с полями для ввода: количество лидов, количество сделок, расходы на рекламу, конверсия, стоимость лида, стоимость сделки
2. **Given** пользователь находится в маркетинговой секции, **When** редактирует поле "Расходы на рекламу", **Then** может ввести новое значение с сохранением изменений
3. **Given** пользователь работает с маркетинговой секцией, **When** просматривает месячные колонки PNL, **Then** убеждается, что маркетинговые данные не влияют на финансовые данные по месяцам

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically populate PNL table cells with aggregated values from processed CSV transaction data
- **FR-002**: System MUST allow manual editing of non-formula cells (category values, individual amounts)
- **FR-003**: System MUST protect formula cells (totals, subtotals, calculated values) from manual editing
- **FR-004**: System MUST auto-recalculate formula cells when editable cells are modified
- **FR-005**: System MUST provide visual indication of which cells are editable vs formula-protected
- **FR-006**: System MUST persist manual changes to database and restore them on page reload
- **FR-007**: System MUST validate that formula calculations remain mathematically correct after manual edits
- **FR-008**: System MUST aggregate multiple CSV file data correctly when populating the same category cells
- **FR-009**: System MUST handle currency conversion consistently between auto-populated and manually entered values
- **FR-010**: System MUST display dedicated marketing metrics section in PNL table with fields for leads count, deals count, ad spend, conversion rate, cost per lead, and cost per deal
- **FR-011**: System MUST allow manual data entry and editing in marketing metrics section independent of monthly financial columns
- **FR-012**: System MUST maintain complete data isolation between marketing section and monthly financial data

### Key Entities *(include if feature involves data)*

- **PNL Table Cell**: Individual cell that can contain either a manually editable value or a calculated formula result
- **Category Row**: Row in PNL table representing income or expense category with associated values
- **Formula Cell**: Protected cell that contains automatic calculation based on other cell values
- **Marketing Metrics Section**: Dedicated section in PNL table for manual marketing data entry separate from monthly financial columns

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully auto-populate PNL table from CSV data processing in under 5 seconds
- **SC-002**: Manual editing of editable cells completes successfully with immediate visual feedback in 100% of attempts
- **SC-003**: Formula cells remain protected from editing with clear visual indication in 100% of attempts
- **SC-004**: Auto-calculation of formulas occurs within 2 seconds of any manual cell edit
- **SC-005**: System maintains data integrity with zero calculation errors after 100+ manual edit operations
- **SC-006**: Marketing metrics section allows manual data entry and editing with 100% data persistence accuracy
- **SC-007**: Marketing section maintains complete isolation from monthly financial data with zero data mixing

---

## Edge Cases

- What happens when user tries to edit a formula cell and how is the protection communicated?
- How does system handle manual edits that might create mathematical inconsistencies?
- What occurs when CSV data conflicts with manually entered values in the same category?
- How does system manage very large PNL tables with many categories and complex formulas?
- What happens when new CSV data is processed after manual edits have been made?
- What occurs when user enters non-numeric values in marketing metrics fields that require numerical input?
- How does system handle marketing data when switching between different years in the system?
