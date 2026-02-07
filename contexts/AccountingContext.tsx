import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/template';
import {
  fetchCategories,
  createCategory,
  deleteCategory,
  initializeDefaultCategories,
  Category,
} from '@/services/categoryService';
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  TransactionWithCategory,
} from '@/services/transactionService';

interface AccountingContextType {
  categories: Category[];
  transactions: TransactionWithCategory[];
  loading: boolean;
  refreshData: () => Promise<void>;
  addCategory: (name: string, type: 'income' | 'expense', icon?: string, color?: string) => Promise<void>;
  removeCategory: (categoryId: string) => Promise<void>;
  addTransaction: (
    type: 'income' | 'expense',
    amount: number,
    categoryId: string | null,
    description: string,
    date: string
  ) => Promise<void>;
  editTransaction: (
    transactionId: string,
    updates: {
      type?: 'income' | 'expense';
      amount?: number;
      category_id?: string | null;
      description?: string;
      date?: string;
    }
  ) => Promise<void>;
  removeTransaction: (transactionId: string) => Promise<void>;
}

export const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

export function AccountingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setCategories([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [categoriesData, transactionsData] = await Promise.all([
        fetchCategories(user.id),
        fetchTransactions(user.id),
      ]);

      if (categoriesData.length === 0) {
        await initializeDefaultCategories(user.id);
        const updatedCategories = await fetchCategories(user.id);
        setCategories(updatedCategories);
      } else {
        setCategories(categoriesData);
      }

      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const addCategory = useCallback(
    async (name: string, type: 'income' | 'expense', icon?: string, color?: string) => {
      if (!user?.id) return;
      const newCategory = await createCategory(user.id, name, type, icon, color);
      setCategories(prev => [...prev, newCategory]);
    },
    [user?.id]
  );

  const removeCategory = useCallback(async (categoryId: string) => {
    await deleteCategory(categoryId);
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
  }, []);

  const addTransaction = useCallback(
    async (
      type: 'income' | 'expense',
      amount: number,
      categoryId: string | null,
      description: string,
      date: string
    ) => {
      if (!user?.id) return;
      await createTransaction(user.id, type, amount, categoryId, description, date);
      await refreshData();
    },
    [user?.id, refreshData]
  );

  const editTransaction = useCallback(
    async (
      transactionId: string,
      updates: {
        type?: 'income' | 'expense';
        amount?: number;
        category_id?: string | null;
        description?: string;
        date?: string;
      }
    ) => {
      await updateTransaction(transactionId, updates);
      await refreshData();
    },
    [refreshData]
  );

  const removeTransaction = useCallback(async (transactionId: string) => {
    await deleteTransaction(transactionId);
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
  }, []);

  return (
    <AccountingContext.Provider
      value={{
        categories,
        transactions,
        loading,
        refreshData,
        addCategory,
        removeCategory,
        addTransaction,
        editTransaction,
        removeTransaction,
      }}
    >
      {children}
    </AccountingContext.Provider>
  );
}
