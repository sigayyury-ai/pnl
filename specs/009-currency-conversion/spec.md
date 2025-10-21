# Feature Specification: Enhanced Currency Conversion System

**Feature Branch**: `009-currency-conversion`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "при загрузке файлов ты увидишь что у тебя там будет операция из множестве валют в злотых в евро и в долларах твоя задача привести все к злотому через курсовые через курсы которые нужно брать и устанавливать в момент обработки операции я думаю что можно подключиться какой-нибудь API и дергать курсы исходя из него и не выставлять руками"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Real-time Currency Conversion with Live API (Priority: P1)

Пользователь загружает CSV файл с операциями в разных валютах (EUR, USD, PLN), и система автоматически получает актуальные курсы валют через внешний API и конвертирует все суммы в PLN на момент обработки файла.

**Why this priority**: Без точной конвертации валют невозможно корректно вести PNL отчетность, особенно для международного бизнеса с операциями в разных валютах.

**Independent Test**: Можно протестировать независимо, загрузив CSV файл с операциями в EUR и USD, проверив что система получила актуальные курсы и корректно конвертировала суммы в PLN.

**Acceptance Scenarios**:

1. **Given** пользователь загружает CSV файл с операциями в EUR, USD и PLN, **When** система начинает обработку, **Then** автоматически получает актуальные курсы валют через внешний API в момент обработки
2. **Given** система получила курсы валют (например, EUR/PLN = 4.32, USD/PLN = 4.18), **When** конвертирует операции, **Then** корректно пересчитывает все суммы в PLN с использованием этих курсов
3. **Given** операция на 100 EUR с курсом 4.32, **When** система конвертирует, **Then** получается 432 PLN с сохранением информации об исходной валюте и курсе

---

### User Story 2 - Robust Exchange Rate API with Fallback (Priority: P1)

Система использует надежный API для получения курсов валют с автоматическим fallback на альтернативный источник или консервативные значения в случае недоступности основного API.

**Why this priority**: Отказоустойчивость критична для бизнес-процессов - система не должна ломаться из-за недоступности внешнего API.

**Independent Test**: Можно протестировать, симулируя недоступность основного API и проверив, что система корректно переключается на fallback механизм.

**Acceptance Scenarios**:

1. **Given** основной API курсов валют недоступен, **When** система пытается получить курсы, **Then** автоматически переключается на альтернативный источник или использует консервативные значения
2. **Given** система использует fallback курсы, **When** обрабатывает операции, **Then** сохраняет информацию о том, что использовались fallback значения
3. **Given** операция требует конвертации, **When** все источники курсов недоступны, **Then** система показывает предупреждение пользователю и предлагает ручное указание курсов

---

### User Story 3 - Historical Exchange Rate Support (Priority: P2)

Система может получать исторические курсы валют для операций с датами в прошлом, обеспечивая корректную конвертацию для ретроспективного анализа данных.

**Why this priority**: Исторические данные важны для аудита и анализа, но не критичны для основной функциональности - можно реализовать во вторую очередь.

**Independent Test**: Можно протестировать, загрузив CSV файл с операциями прошлого месяца и проверив, что система использует актуальные для того времени курсы.

**Acceptance Scenarios**:

1. **Given** CSV файл содержит операции с датами прошлого месяца, **When** система обрабатывает файл, **Then** запрашивает исторические курсы валют для соответствующих дат
2. **Given** система получила исторические курсы для даты операции, **When** конвертирует операцию, **Then** использует курс актуальный на дату операции, а не текущий курс
3. **Given** операция на 100 EUR от 15 ноября с историческим курсом 4.28, **When** система конвертирует, **Then** получается 428 PLN с указанием исторического курса и даты

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically detect currencies in CSV operations and identify which currencies require conversion to PLN
- **FR-002**: System MUST integrate with reliable external exchange rate API to get real-time currency conversion rates
- **FR-003**: System MUST use exchange rates fetched at the moment of CSV processing, not cached or manual rates
- **FR-004**: System MUST implement robust fallback mechanism when primary exchange rate API is unavailable
- **FR-005**: System MUST store original currency, original amount, exchange rate used, and converted PLN amount for each transaction
- **FR-006**: System MUST support historical exchange rates for operations with past dates when available from API
- **FR-007**: System MUST handle currency conversion errors gracefully with clear error messages and user guidance
- **FR-008**: System MUST validate exchange rates for reasonableness (not zero, not extremely high/low values)
- **FR-009**: System MUST support major currencies: EUR, USD, GBP, CHF, and PLN as base currency
- **FR-010**: System MUST log exchange rate API calls and conversion results for debugging and audit purposes

### Technical Requirements

- **TR-001**: Exchange rate API integration MUST use HTTPS with proper error handling and timeout management
- **TR-002**: System MUST cache exchange rates for current day to avoid excessive API calls during single CSV processing session
- **TR-003**: Currency conversion MUST maintain precision to at least 4 decimal places for exchange rates and 2 decimal places for amounts
- **TR-004**: System MUST implement retry mechanism for failed API calls with exponential backoff

### Key Entities *(include if feature involves data)*

- **Exchange Rate**: Current or historical conversion rate between currency pairs (e.g., EUR/PLN = 4.32)
- **Currency Conversion**: Process of converting transaction amount from original currency to PLN using exchange rate
- **Exchange Rate API**: External service providing real-time and/or historical currency exchange rates
- **Fallback Rate**: Predefined or alternative exchange rate used when primary API is unavailable
- **Conversion Audit**: Record of exchange rate used, API source, timestamp, and conversion result for each operation

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: System successfully converts 100% of non-PLN currencies to PLN using live exchange rate API within 10 seconds of CSV processing start
- **SC-002**: Currency conversion maintains accuracy within 0.01 PLN for 99% of operations compared to officially published exchange rates
- **SC-003**: System handles API failures gracefully with fallback rates in 100% of cases, never failing CSV processing due to currency conversion issues
- **SC-004**: Exchange rate API calls complete within 5 seconds with 95% success rate during normal network conditions
- **SC-005**: Historical exchange rates are retrieved and applied correctly for 90% of operations with past dates when available from API

---

## Edge Cases

- What happens when exchange rate API returns invalid or corrupted data (non-numeric rates, negative rates)?
- How does system handle currency codes that are not supported by the exchange rate API?
- What occurs when CSV contains operations with dates far in the future and no exchange rates are available?
- How does system manage very large CSV files requiring many API calls (rate limiting considerations)?
- What happens when the same currency has significantly different exchange rates for operations on the same day?
- How does system handle network timeouts during exchange rate API calls?
- What occurs when exchange rate API returns unrealistic values (e.g., 1000 PLN for 1 EUR)?
- How does system validate and handle edge cases like extremely large transaction amounts that might cause precision issues?
