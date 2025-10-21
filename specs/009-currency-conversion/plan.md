---
description: "Technical implementation plan for Enhanced Currency Conversion System"
---

# Plan: Enhanced Currency Conversion System

**Input**: [spec.md](./spec.md) - Enhanced Currency Conversion System specification

## Phase 0: Research & Architecture

### Research Summary

**Current State Analysis**:
- Existing `getExchangeRates()` function uses basic `exchangerate-api.com/v4/latest/EUR`
- Has fallback mechanism with hardcoded rates
- Simple conversion logic without proper error handling or caching
- No support for historical rates

**API Options Evaluated**:
1. **exchangerate-api.com** - Current choice, free tier available, supports real-time rates
2. **fixer.io** - Professional service, requires API key, supports historical data
3. **currencylayer.com** - Paid service with good reliability
4. **European Central Bank API** - Free but EUR-based, requires conversion

**Recommended Approach**: 
- Continue with exchangerate-api.com as primary source (free, reliable)
- Implement robust fallback and caching mechanisms
- Add support for additional APIs in future iterations
- Implement proper error handling and validation

## Phase 1: Service Architecture Design

### Core Components

1. **CurrencyService Class** (`services/currencyService.js`)
   - Centralized currency conversion logic
   - API abstraction for multiple exchange rate sources
   - Caching mechanism for rate optimization
   - Error handling and fallback management

2. **Integration Points**:
   - Update `server.js` `convertCurrenciesToPLN()` function
   - Integrate with CSV processing workflow
   - Add logging and audit trail

### Database Considerations

**No new tables required** - existing `transactions` table already has:
- `amount` (original amount)
- `currency` (original currency)
- `amount_pln` (converted amount)

**Enhancement**: Add audit fields for exchange rate tracking:
- `exchange_rate` (rate used for conversion)
- `conversion_date` (when conversion occurred)
- `rate_source` (which API was used)

## Phase 2: Implementation Strategy

### Backend Implementation

1. **CurrencyService Implementation**
   ```javascript
   class CurrencyService {
     async getExchangeRates(currencies, date)
     async getCurrentRates(currencies)
     convertToPLN(amount, fromCurrency, rates)
     convertOperationsToPLN(operations, rates)
   }
   ```

2. **Error Handling Strategy**:
   - Primary API failure → Try secondary API
   - All APIs fail → Use cached rates
   - No cached rates → Use fallback hardcoded rates
   - Log all failures for debugging

3. **Caching Strategy**:
   - In-memory cache for 1 hour (configurable)
   - Cache key: `rates_${date}_${currencies.join('_')}`
   - Automatic cache invalidation

### API Integration Details

**Primary API**: `exchangerate-api.com/v4/latest/PLN`
- Free tier: 1500 requests/month
- Real-time data
- PLN as base currency (perfect for our use case)

**Fallback Strategy**:
1. Try primary API with 5-second timeout
2. If fails, try historical cache from same day
3. If still fails, use predefined fallback rates
4. Log all attempts for monitoring

## Phase 3: Testing & Validation

### Test Scenarios

1. **Happy Path Testing**:
   - CSV with EUR, USD operations
   - Verify real-time rate fetching
   - Confirm accurate PLN conversion

2. **Error Handling Testing**:
   - Simulate API failures
   - Test network timeouts
   - Validate fallback mechanisms

3. **Edge Case Testing**:
   - Large amounts (precision testing)
   - Unknown currencies
   - Historical date operations

### Performance Considerations

- Cache exchange rates for current day operations
- Batch currency conversions to minimize API calls
- Implement rate limiting to respect API quotas

## Phase 4: Integration & Deployment

### Integration Points

1. **CSV Processing Pipeline**:
   ```
   CSV Upload → Parse Operations → Detect Currencies → 
   Fetch Exchange Rates → Convert to PLN → Proceed with Categorization
   ```

2. **Error Recovery**:
   - Failed conversions logged but don't block processing
   - User notifications for conversion issues
   - Manual rate override capability (future enhancement)

### Monitoring & Logging

- Log all API calls and responses
- Track conversion accuracy vs published rates
- Monitor API quota usage
- Alert on repeated failures

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Required Gates** (from `/memory/constitution.md`):
- ✅ **User-Centric**: Feature solves real business problem - accurate multi-currency PNL reporting with live exchange rates
- ✅ **Spec-Driven**: Complete specification exists with acceptance criteria and edge cases defined
- ✅ **Technical Standards**: Implementation follows established Node.js/Supabase/Render stack, integrates with existing CSV processing
- ✅ **Code Quality**: Implementation plan includes comprehensive error handling, logging, caching, and fallback mechanisms
- ✅ **Data Integrity**: Maintains audit trail of exchange rates used and conversion accuracy for financial compliance
- ✅ **Security**: No sensitive data exposure, proper API key handling, safe external API integration
- ✅ **Performance**: Optimized for Render platform with caching, timeout management, and API call minimization

**Gate Status**: All gates pass - ready for implementation

## Success Metrics

- API success rate > 95% during normal operations
- Conversion accuracy within 0.01 PLN of official rates
- CSV processing time < 10 seconds for 100 operations
- Zero CSV processing failures due to currency conversion issues
- Cache hit rate > 80% for same-day operations

## Future Enhancements

- Multiple API provider support with automatic failover
- Historical rate database for audit compliance
- Manual rate override interface for edge cases
- Real-time rate monitoring dashboard
