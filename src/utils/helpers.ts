import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { getMonedaById } from '../database/repositories/monedasRepository';

export const formatCurrency = (amount: number, symbol: string = '$'): string => {
  if (!amount || isNaN(amount)) amount = 0;
  return `${symbol}${amount.toFixed(2)}`;
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy', { locale: es });
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy HH:mm', { locale: es });
};

export const formatCurrencyWithSymbol = async (
  amount: number,
  monedaId?: number
): Promise<string> => {
  if (!monedaId) {
    return formatCurrency(amount);
  }

  const moneda = await getMonedaById(monedaId);
  if (moneda) {
    return formatCurrency(amount, moneda.simbolo);
  }

  return formatCurrency(amount);
};
