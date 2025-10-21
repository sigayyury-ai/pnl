# Feature Specification: Marketing Metrics Section in PNL Table

**Feature Branch**: `008-marketing-metrics-section`  
**Created**: 2025-10-21  
**Status**: Draft  
**Input**: User description: "так так же в эту табличку давай добавим такую маркетинговую секцию которая также будет не интегрирована по месячным в этом маркетинговой секции мы будем указывать количество лидов количество сделок расходы на рекламу конверсию и сделку в продаже стоимость ли до стоимость сделки вот и эти данные будут вноситься уже руками"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Marketing Section Display and Manual Data Entry (Priority: P1)

Пользователь видит отдельную маркетинговую секцию в PNL таблице с полями для ввода ключевых маркетинговых метрик: количество лидов, количество сделок, расходы на рекламу, конверсия, стоимость лида и стоимость сделки. Все данные вводятся вручную и не интегрируются с месячными колонками.

**Why this priority**: Маркетинговые метрики критично важны для анализа эффективности маркетинговых кампаний и их ROI, но требуют отдельного отслеживания от финансовых операций.

**Independent Test**: Можно протестировать независимо, открыв PNL таблицу, найдя маркетинговую секцию и проверив возможность ввода всех указанных метрик.

**Acceptance Scenarios**:

1. **Given** пользователь открывает PNL таблицу, **When** просматривает полную таблицу, **Then** видит отдельную маркетинговую секцию с полями: количество лидов, количество сделок, расходы на рекламу, конверсия, стоимость лида, стоимость сделки
2. **Given** пользователь находится в маркетинговой секции, **When** кликает на поле "Количество лидов", **Then** может ввести числовое значение для данной метрики
3. **Given** пользователь вводит данные в различные поля маркетинговой секции, **When** завершает ввод, **Then** все значения сохраняются и отображаются при последующих открытиях таблицы

---

### User Story 2 - Marketing Metrics Data Management (Priority: P1)

Пользователь может редактировать, обновлять и управлять маркетинговыми данными в таблице, при этом эти данные остаются независимыми от месячных финансовых колонок.

**Why this priority**: Возможность обновления маркетинговых метрик необходима для актуализации данных и корректного анализа эффективности маркетинга.

**Independent Test**: Можно протестировать независимо, изменив несколько маркетинговых показателей и проверив, что изменения сохраняются и не влияют на месячные финансовые данные.

**Acceptance Scenarios**:

1. **Given** пользователь просматривает заполненную маркетинговую секцию, **When** редактирует значение в поле "Расходы на рекламу", **Then** система сохраняет новое значение с сохранением всей остальной информации
2. **Given** пользователь изменяет значения конверсии и стоимости лида, **When** проверяет другие поля маркетинговой секции, **Then** видит, что остальные данные остались неизменными
3. **Given** пользователь работает с маркетинговой секцией, **When** просматривает месячные колонки PNL, **Then** убеждается, что маркетинговые данные не смешиваются с финансовыми операциями по месяцам

---

### User Story 3 - Marketing Metrics Calculations and Display (Priority: P2)

Система отображает маркетинговые метрики в удобном формате с возможностью расчета производных показателей (например, ROI маркетинга) на основе введенных данных.

**Why this priority**: Автоматические расчеты помогают пользователю быстрее анализировать эффективность маркетинга, но не критичны для базовой функциональности.

**Independent Test**: Можно протестировать независимо, введя тестовые данные в маркетинговые поля и проверив корректность отображения и любых автоматических расчетов.

**Acceptance Scenarios**:

1. **Given** пользователь ввел данные о расходах на рекламу и количестве сделок, **When** просматривает маркетинговую секцию, **Then** система может показать рассчитанные дополнительные метрики (например, стоимость лида = расходы на рекламу / количество лидов)
2. **Given** данные в маркетинговой секции обновлены, **When** пользователь открывает таблицу, **Then** все метрики отображаются в актуальном состоянии с правильным форматированием чисел и валют
3. **Given** пользователь изменил несколько маркетинговых показателей, **When** сохраняет данные, **Then** все вычисления обновляются автоматически для отражения новых значений

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display dedicated marketing metrics section in PNL table separate from monthly financial columns
- **FR-002**: System MUST provide fields for manual data entry: количество лидов, количество сделок, расходы на рекламу, конверсия, стоимость лида, стоимость сделки
- **FR-003**: System MUST allow manual editing of all marketing metrics fields with immediate saving capability
- **FR-004**: System MUST maintain data isolation between marketing section and monthly financial data columns
- **FR-005**: System MUST preserve marketing metrics data independently from CSV processing and monthly transaction data
- **FR-006**: System MUST validate numeric input for marketing metrics fields and handle invalid data gracefully
- **FR-007**: System MUST display marketing metrics with appropriate formatting (numbers, currencies) for user readability
- **FR-008**: System MUST support real-time calculation of derived marketing metrics (e.g., cost per lead = ad spend / number of leads)
- **FR-009**: System MUST maintain marketing data consistency across different year contexts when switching between years

### Key Entities *(include if feature involves data)*

- **Marketing Metrics Section**: Dedicated section in PNL table containing marketing performance indicators independent of monthly financial data
- **Marketing Metric**: Individual marketing performance indicator (leads count, deals count, ad spend, conversion rate, cost per lead, cost per deal)
- **Marketing Data**: Collection of all marketing metrics for specific year with manual update capability

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully enter and edit all marketing metrics fields with 100% data persistence accuracy
- **SC-002**: Marketing section maintains complete data isolation from monthly financial columns with zero data mixing
- **SC-003**: Marketing metrics display with proper formatting and real-time calculations within 2 seconds of data update
- **SC-004**: System handles marketing data validation and error states gracefully with clear user feedback
- **SC-005**: Marketing metrics remain consistent and accessible when switching between different years in the system

---

## Edge Cases

- What happens when user enters non-numeric values in numeric marketing fields?
- How does system handle very large numbers in marketing metrics (e.g., millions of leads)?
- What occurs when marketing section is edited while other parts of PNL table are being modified?
- How does system manage marketing data when switching between years with different marketing contexts?
- What happens when user tries to delete or reset marketing metrics data?
- How does system handle currency display for marketing expenses in different locales?
