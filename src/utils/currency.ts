export type CurrencyType = 'IQD' | 'USD';

export const formatCurrency = (amount: number, currency: CurrencyType = 'IQD'): string => {
  if (currency === 'IQD') {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' د.ع';
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
};
