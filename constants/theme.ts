export const colors = {
  primary: '#10B981', // Green for money/finance
  primaryLight: '#34D399',
  primaryDark: '#059669',
  secondary: '#6366F1',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  income: '#10B981',
  expense: '#EF4444',
  text: '#111827',
  textSecondary: '#6B7280',
  textOnPrimary: '#FFFFFF',
  border: '#E5E7EB',
  disabled: '#D1D5DB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const categoryIcons = {
  // Expense icons
  food: 'restaurant',
  transport: 'directions-car',
  shopping: 'shopping-bag',
  entertainment: 'movie',
  bills: 'receipt',
  health: 'local-hospital',
  education: 'school',
  other: 'more-horiz',
  
  // Income icons
  salary: 'account-balance-wallet',
  business: 'business',
  investment: 'trending-up',
  gift: 'card-giftcard',
};

export const categoryColors = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
  '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6',
];
