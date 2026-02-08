import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAccounting } from '@/hooks/useAccounting';
import { useAlert } from '@/template';
import { colors, spacing, typography } from '@/constants/theme';
import { TransactionWithCategory } from '@/services/transactionService';

export default function TransactionsScreen() {
  const { transactions, loading, refreshData, removeTransaction } = useAccounting();
  const { showAlert } = useAlert();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleDelete = (transactionId: string) => {
    showAlert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeTransaction(transactionId);
            showAlert('Transaction deleted successfully');
          } catch (error) {
            showAlert('Failed to delete transaction');
          }
        },
      },
    ]);
  };

  const renderTransaction = ({ item }: { item: TransactionWithCategory }) => {
    const isIncome = item.type === 'income';
    const categoryName = item.category?.name || 'Uncategorized';
    const categoryIcon = item.category?.icon || 'more-horiz';
    const categoryColor = item.category?.color || colors.textSecondary;

    return (
      <View style={styles.transactionCard}>
        <View style={[styles.iconContainer, { backgroundColor: categoryColor + '20' }]}>
          <MaterialIcons name={categoryIcon as any} size={24} color={categoryColor} />
        </View>

        <View style={styles.transactionInfo}>
          <Text style={styles.categoryText}>{categoryName}</Text>
          {item.description && <Text style={styles.descriptionText}>{item.description}</Text>}
          <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>

        <View style={styles.transactionRight}>
          <Text style={[styles.amountText, isIncome ? styles.incomeText : styles.expenseText]}>
            {isIncome ? '+' : '-'}${Number(item.amount).toFixed(2)}
          </Text>
          <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="delete" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Transactions</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.scanButton} onPress={() => router.push('/scan-receipt' as any)}>
            <MaterialIcons name="camera-alt" size={20} color={colors.textOnPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-transaction' as any)}>
            <MaterialIcons name="add" size={24} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        renderItem={renderTransaction}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="receipt-long" size={64} color={colors.disabled} />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add your first transaction</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scanButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  categoryText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  descriptionText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  dateText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  amountText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  incomeText: {
    color: colors.income,
  },
  expenseText: {
    color: colors.expense,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
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
