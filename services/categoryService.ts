import { getSupabaseClient } from '@/template';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  created_at: string;
}

const supabase = getSupabaseClient();

export const fetchCategories = async (userId: string): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createCategory = async (
  userId: string,
  name: string,
  type: 'income' | 'expense',
  icon?: string,
  color?: string
): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name,
      type,
      icon,
      color,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);

  if (error) throw error;
};

export const initializeDefaultCategories = async (userId: string): Promise<void> => {
  const defaultCategories = [
    { name: 'Salary', type: 'income' as const, icon: 'account-balance-wallet', color: '#10B981' },
    { name: 'Business', type: 'income' as const, icon: 'business', color: '#3B82F6' },
    { name: 'Food & Dining', type: 'expense' as const, icon: 'restaurant', color: '#EF4444' },
    { name: 'Transportation', type: 'expense' as const, icon: 'directions-car', color: '#F59E0B' },
    { name: 'Shopping', type: 'expense' as const, icon: 'shopping-bag', color: '#EC4899' },
    { name: 'Bills & Utilities', type: 'expense' as const, icon: 'receipt', color: '#6366F1' },
    { name: 'Entertainment', type: 'expense' as const, icon: 'movie', color: '#8B5CF6' },
    { name: 'Health', type: 'expense' as const, icon: 'local-hospital', color: '#14B8A6' },
  ];

  const { error } = await supabase
    .from('categories')
    .insert(
      defaultCategories.map(cat => ({
        user_id: userId,
        ...cat,
      }))
    );

  if (error && !error.message.includes('duplicate')) {
    throw error;
  }
};
