
// lib/currencyConverter.ts

const API_KEY = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY;
const BASE_URL = 'https://v6.exchangerate-api.com/v6'; // Example for ExchangeRate-API

interface ExchangeRates {
  [currency: string]: number;
}

export async function convertToUSD(amount: number, fromCurrency: string): Promise<number> {
  try {
    // Fetch exchange rates
    const response = await fetch(`${BASE_URL}/${API_KEY}/latest/${fromCurrency}`);
    const data = await response.json();

    if (data.result === 'error') {
      throw new Error(data['error-type']);
    }

    const exchangeRates: ExchangeRates = data.conversion_rates;

    // Get the USD exchange rate for the provided currency
    const usdRate = exchangeRates.USD;

    if (!usdRate) {
      throw new Error(`Exchange rate for ${fromCurrency} to USD not found.`);
    }

    // Convert the amount to USD
    const convertedAmount = amount * usdRate;
    return convertedAmount;
  } catch (error) {
    console.error('Error converting currency:', error);
    throw error;
  }
}