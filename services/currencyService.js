// Using built-in fetch available in Node.js 18+

/**
 * Currency Service for real-time exchange rate fetching and conversion
 */
class CurrencyService {
  constructor() {
    this.baseUrl = 'https://api.exchangerate-api.com/v4/latest';
    this.fallbackUrl = 'https://api.fixer.io/latest';
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour cache
    this.timeout = 5000; // 5 second timeout
    
    // Fallback rates (updated periodically)
    this.fallbackRates = {
      'USD': 4.2,
      'EUR': 4.5,
      'GBP': 5.3,
      'CHF': 4.7,
      'PLN': 1.0
    };
  }

  /**
   * Get exchange rates for specified currencies relative to PLN
   * @param {Array} currencies - Array of currency codes
   * @param {string} date - Optional date for historical rates (YYYY-MM-DD)
   * @returns {Object} Exchange rates object
   */
  async getExchangeRates(currencies, date = null) {
    const normalizedCurrencies = currencies.map(c => c.toUpperCase());
    const key = `rates_${date || 'latest'}_${normalizedCurrencies.sort().join('_')}`;
    
    // Check cache first
    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log(`Using cached exchange rates for ${normalizedCurrencies.join(', ')}`);
        return cached.rates;
      }
    }

    try {
      let rates;
      
      if (date && date !== this.getTodayString()) {
        rates = await this.getHistoricalRates(normalizedCurrencies, date);
      } else {
        rates = await this.getCurrentRates(normalizedCurrencies);
      }
      
      // Cache the results
      this.cache.set(key, {
        rates,
        timestamp: Date.now()
      });
      
      return rates;
      
    } catch (error) {
      console.error('Exchange rate API error:', error);
      console.log('Using fallback rates');
      return this.getFallbackRates(normalizedCurrencies);
    }
  }

  /**
   * Get current exchange rates
   */
  async getCurrentRates(currencies) {
    const response = await Promise.race([
      fetch(`${this.baseUrl}/PLN`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PNL-System/1.0'
        },
        timeout: this.timeout
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), this.timeout)
      )
    ]);

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.rates) {
      throw new Error('Invalid API response format');
    }

    const rates = {};
    currencies.forEach(currency => {
      if (currency === 'PLN') {
        rates[currency] = 1.0;
      } else {
        // API returns rates where PLN=1, so EUR=4.32 means 1 EUR = 4.32 PLN
        rates[currency] = data.rates[currency] || this.fallbackRates[currency] || 1.0;
      }
    });

    this.validateRates(rates);
    return rates;
  }

  /**
   * Get historical exchange rates (if supported by API)
   */
  async getHistoricalRates(currencies, date) {
    // For now, use current rates as fallback for historical data
    // In production, you might want to use a different API that supports historical data
    console.log(`Historical rates for ${date} requested, using current rates`);
    return await this.getCurrentRates(currencies);
  }

  /**
   * Get fallback rates when API is unavailable
   */
  getFallbackRates(currencies) {
    const rates = {};
    currencies.forEach(currency => {
      rates[currency] = this.fallbackRates[currency] || 1.0;
    });
    return rates;
  }

  /**
   * Validate exchange rates for reasonableness
   */
  validateRates(rates) {
    Object.entries(rates).forEach(([currency, rate]) => {
      if (typeof rate !== 'number' || rate <= 0 || rate > 1000) {
        console.warn(`Suspicious exchange rate for ${currency}: ${rate}`);
        // Could throw error or use fallback here
      }
    });
  }

  /**
   * Convert amount from one currency to PLN
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency
   * @param {Object} rates - Exchange rates object
   * @returns {Object} Conversion result
   */
  convertToPLN(amount, fromCurrency, rates) {
    const rate = rates[fromCurrency.toUpperCase()] || 1.0;
    
    if (fromCurrency.toUpperCase() === 'PLN') {
      return {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount: Math.abs(amount),
        exchangeRate: 1.0,
        isConverted: false
      };
    }

    const convertedAmount = Math.abs(amount) * rate;
    
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: convertedAmount,
      exchangeRate: rate,
      isConverted: true
    };
  }

  /**
   * Convert multiple operations to PLN
   * @param {Array} operations - Array of operations with amount and currency
   * @param {Object} rates - Exchange rates object
   * @returns {Array} Converted operations
   */
  convertOperationsToPLN(operations, rates) {
    return operations.map(operation => {
      const conversion = this.convertToPLN(
        parseFloat(operation.amount) || 0,
        operation.currency || 'PLN',
        rates
      );
      
      return {
        ...operation,
        amount_pln: conversion.convertedAmount,
        original_amount: conversion.originalAmount,
        original_currency: conversion.originalCurrency,
        exchange_rate: conversion.exchangeRate,
        is_converted: conversion.isConverted
      };
    });
  }

  /**
   * Get today's date as string
   */
  getTodayString() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = CurrencyService;
