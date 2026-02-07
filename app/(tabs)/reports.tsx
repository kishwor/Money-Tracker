import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useAccounting } from '@/hooks/useAccounting';
import { colors, spacing, typography } from '@/constants/theme';

export default function ReportsScreen() {
  const { transactions, loading } = useAccounting();

  const analytics = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = totalIncome - totalExpense;

    const categoryBreakdown = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const categoryName = t.category?.name || 'Uncategorized';
        const categoryColor = t.category?.color || colors.textSecondary;
        if (!acc[categoryName]) {
          acc[categoryName] = { amount: 0, color: categoryColor };
        }
        acc[categoryName].amount += Number(t.amount);
        return acc;
      }, {} as Record<string, { amount: number; color: string }>);

    const sortedCategories = Object.entries(categoryBreakdown)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalIncome,
      totalExpense,
      balance,
      categoryBreakdown: sortedCategories,
    };
  }, [transactions]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Financial Summary</Text>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryItem, { backgroundColor: colors.income + '15' }]}>
              <MaterialIcons name="trending-up" size={32} color={colors.income} />
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={[styles.summaryAmount, { color: colors.income }]}>
                ${analytics.totalIncome.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.summaryItem, { backgroundColor: colors.expense + '15' }]}>
              <MaterialIcons name="trending-down" size={32} color={colors.expense} />
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={[styles.summaryAmount, { color: colors.expense }]}>
                ${analytics.totalExpense.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={[styles.balanceCard, analytics.balance >= 0 ? styles.positiveBalance : styles.negativeBalance]}>
            <Text style={styles.balanceLabel}>Net Balance</Text>
            <Text style={styles.balanceAmount}>${analytics.balance.toFixed(2)}</Text>
          </View>
        </View>

        {analytics.categoryBreakdown.length > 0 && (
          <View style={styles.categoryCard}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            {analytics.categoryBreakdown.map((cat, index) => {
              const percentage = ((cat.amount / analytics.totalExpense) * 100).toFixed(1);
              return (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryNameContainer}>
                      <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                      <Text style={styles.categoryName}>{cat.name}</Text>
                    </View>
                    <Text style={styles.categoryAmount}>${cat.amount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${percentage}%`, backgroundColor: cat.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.percentageText}>{percentage}%</Text>
                </View>
              );
            })}
          </View>
        )}

        {transactions.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="bar-chart" size={64} color={colors.disabled} />
            <Text style={styles.emptyText}>No data yet</Text>
            <Text style={styles.emptySubtext}>Add transactions to see your financial reports</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  content: {
    padding: spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryItem: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  summaryAmount: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
  },
  balanceCard: {
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  positiveBalance: {
    backgroundColor: colors.income + '15',
  },
  negativeBalance: {
    backgroundColor: colors.expense + '15',
  },
  balanceLabel: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  balanceAmount: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryItem: {
    marginBottom: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  categoryName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  categoryAmount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
