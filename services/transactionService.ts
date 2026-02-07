import { getSupabaseClient } from '@/template';

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  type: 'income' | 'expense';
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithCategory extends Transaction {
  category?: {
    name: string;
    icon?: string;
    color?: string;
  };
}

const supabase = getSupabaseClient();

export const fetchTransactions = async (userId: string): Promise<TransactionWithCategory[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      category:categories(name, icon, color)
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createTransaction = async (
  userId: string,
  type: 'income' | 'expense',
  amount: number,
  categoryId: string | null,
  description: string,
  date: string
): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type,
      amount,
      category_id: categoryId,
      description,
      date,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTransaction = async (
  transactionId: string,
  updates: {
    type?: 'income' | 'expense';
    amount?: number;
    category_id?: string | null;
    description?: string;
    date?: string;
  }
): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', transactionId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteTransaction = async (transactionId: string): Promise<void> => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId);

  if (error) throw error;
};
