# Feature Specification: PNL Analytics and Calculations

**Feature Branch**: `005-pnl-analytics`  
**Created**: 2025-10-21  
**Status**: Draft  
**Input**: User description: "также давай немножко проговорим сам функционал таблички pnl значит у нас там есть две категории это расходы и приходы а также должна быть секция total где мы будем высчитывать первое у нас доходы или убытки ну то есть разницу между приходами и расходами также я там хочу видеть баланс баланс это разница между прошлым месяцем и текущим а также я хочу увидеть рои этого месяца то есть насколько мы хорошо отработали"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Profit/Loss Calculation (Priority: P1)

Пользователь открывает PNL таблицу и видит автоматически рассчитанную разницу между приходами и расходами, где система отображает либо доходы (прибыль), либо убытки, в зависимости от того, что больше.

**Why this priority**: Это основная финансовая метрика для любой PNL отчетности - без понимания прибыльности бизнеса система теряет свою основную ценность.

**Independent Test**: Можно протестировать независимо, введя тестовые данные по доходам и расходам и проверив корректность автоматического расчета разности и правильного отображения результата.

**Acceptance Scenarios**:

1. **Given** пользователь открыл PNL таблицу с заполненными данными доходов и расходов, **When** просматривает секцию "Total", **Then** система автоматически рассчитывает и отображает разность между доходами и расходами
2. **Given** общие доходы превышают общие расходы, **When** пользователь смотрит на результат, **Then** система отображает положительный результат как "Прибыль: [сумма] PLN"
3. **Given** общие расходы превышают общие доходы, **When** пользователь смотрит на результат, **Then** система отображает отрицательный результат как "Убыток: [сумма] PLN"

---

### User Story 2 - Balance Comparison with Previous Month (Priority: P1)

Пользователь видит расчет баланса, который показывает изменение финансового положения по сравнению с предыдущим месяцем, отображая динамику развития бизнеса.

**Why this priority**: Мониторинг динамики между месяцами критичен для понимания трендов и эффективности бизнес-операций.

**Independent Test**: Можно протестировать независимо, имея данные за два месяца и проверив корректность расчета разности балансов и правильного отображения.

**Acceptance Scenarios**:

1. **Given** в системе есть данные за текущий и предыдущий месяц, **When** пользователь открывает PNL таблицу, **Then** система рассчитывает и отображает баланс как разность текущего и предыдущего месяца
2. **Given** баланс за текущий месяц больше предыдущего, **When** пользователь просматривает результат, **Then** система отображает положительный баланс: "Рост: +[сумма] PLN"
3. **Given** баланс за текущий месяц меньше предыдущего, **When** пользователь просматривает результат, **Then** система отображает отрицательный баланс: "Снижение: -[сумма] PLN"

---

### User Story 3 - Profitability Ratio (ROI) Calculation (Priority: P2)

Пользователь видит расчет рентабельности за месяц, показывающий эффективность работы - насколько хорошо отработал бизнес по сравнению с понесенными расходами.

**Why this priority**: Рентабельность важна для оценки эффективности работы, но не критична для базовой PNL функциональности - можно реализовать во вторую очередь.

**Independent Test**: Можно протестировать независимо, введя тестовые данные и проверив корректность расчета рентабельности по формуле.

**Acceptance Scenarios**:

1. **Given** в системе есть данные о доходах и расходах за месяц, **When** пользователь открывает PNL таблицу, **Then** система рассчитывает и отображает рентабельность за месяц
2. **Given** система рассчитывает рентабельность, **When** отображает результат, **Then** показывает процентное значение с пояснением эффективности (например, "Рентабельность: 15% - Хорошо", "Рентабельность: 5% - Удовлетворительно")
3. **Given** рентабельность отрицательная, **When** система отображает результат, **Then** показывает предупреждение о неэффективности с рекомендациями

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically calculate profit/loss as difference between total income and total expense categories
- **FR-002**: System MUST display profit/loss results with clear positive/negative indicators and appropriate labeling
- **FR-003**: System MUST automatically calculate balance as difference between current month and previous month total results
- **FR-004**: System MUST display balance comparison with clear growth/decline indicators and PLN amounts
- **FR-005**: System MUST calculate profitability ratio using formula: ((Income - Expenses) / Expenses) * 100 for positive expenses
- **FR-006**: System MUST display profitability ratio as percentage with qualitative assessment of performance level
- **FR-007**: System MUST update all calculated values automatically when underlying income or expense data changes
- **FR-008**: System MUST handle edge cases (zero expenses, missing previous month data) with appropriate fallback values or alerts
- **FR-009**: System MUST preserve calculation accuracy to at least 2 decimal places for financial precision

### Key Entities *(include if feature involves data)*

- **PNL Calculation Section**: Total section containing profit/loss, balance, and profitability ratio calculations
- **Month Balance**: Financial result for a specific month used in balance calculations
- **Profitability Metric**: Calculated profitability ratio with percentage and qualitative assessment

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Profit/loss calculation completes automatically within 2 seconds after any income or expense data change
- **SC-002**: Balance calculation displays correctly for 95% of months with available previous month data
- **SC-003**: Profitability ratio calculation accuracy maintains financial precision within 0.01% margin of error
- **SC-004**: Users can understand financial performance from displayed metrics without additional calculations in 100% of cases
- **SC-005**: System handles missing previous month data gracefully with clear messaging in 100% of edge cases

---

## Edge Cases

- What happens when there are no expenses to calculate profitability ratio (division by zero)?
- How does system handle the first month of data where no previous month exists for balance calculation?
- What occurs when income or expense data contains negative values?
- How does system manage calculation display when data is incomplete or partially loaded?
- What happens when profitability ratio calculation results in extremely high or extremely low percentages?
