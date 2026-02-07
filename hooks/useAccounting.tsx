import { useContext } from 'react';
import { AccountingContext } from '@/contexts/AccountingContext';

export function useAccounting() {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error('useAccounting must be used within AccountingProvider');
  }
  return context;
}
