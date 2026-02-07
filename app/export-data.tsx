import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAccounting } from '@/hooks/useAccounting';
import { useAlert } from '@/template';
import { colors, spacing, typography } from '@/constants/theme';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function ExportDataScreen() {
  const router = useRouter();
  const { transactions, categories } = useAccounting();
  const { showAlert } = useAlert();
  const [exporting, setExporting] = useState(false);

  const generateCSV = (data: any[], headers: string[]) => {
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    );
    return [csvHeaders, ...csvRows].join('\n');
  };

  const exportTransactionsCSV = async () => {
    if (transactions.length === 0) {
      showAlert('No transactions to export');
      return;
    }

    setExporting(true);
    try {
      const data = transactions.map(t => ({
        date: t.date,
        type: t.type,
        category: t.category?.name || 'Uncategorized',
        amount: t.amount,
        description: t.description || '',
      }));

      const csv = generateCSV(data, ['date', 'type', 'category', 'amount', 'description']);
      const fileName = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, csv);

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(filePath, {
            mimeType: 'text/csv',
            dialogTitle: 'Export Transactions',
          });
        } else {
          showAlert('File saved', `Saved to: ${filePath}`);
        }
      } else {
        showAlert('File saved', `Saved to: ${filePath}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      showAlert('Failed to export transactions');
    } finally {
      setExporting(false);
    }
  };

  const exportTransactionsJSON = async () => {
    if (transactions.length === 0) {
      showAlert('No transactions to export');
      return;
    }

    setExporting(true);
    try {
      const data = {
        exportDate: new Date().toISOString(),
        transactions: transactions.map(t => ({
          id: t.id,
          date: t.date,
          type: t.type,
          category: t.category?.name || 'Uncategorized',
          amount: t.amount,
          description: t.description || '',
        })),
        summary: {
          totalTransactions: transactions.length,
          totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0),
          totalExpense: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0),
        },
      };

      const json = JSON.stringify(data, null, 2);
      const fileName = `transactions_${new Date().toISOString().split('T')[0]}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, json);

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(filePath, {
            mimeType: 'application/json',
            dialogTitle: 'Export Transactions',
          });
        } else {
          showAlert('File saved', `Saved to: ${filePath}`);
        }
      } else {
        showAlert('File saved', `Saved to: ${filePath}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      showAlert('Failed to export transactions');
    } finally {
      setExporting(false);
    }
  };

  const exportCategoriesJSON = async () => {
    if (categories.length === 0) {
      showAlert('No categories to export');
      return;
    }

    setExporting(true);
    try {
      const data = {
        exportDate: new Date().toISOString(),
        categories: categories.map(c => ({
          name: c.name,
          type: c.type,
          icon: c.icon,
          color: c.color,
        })),
      };

      const json = JSON.stringify(data, null, 2);
      const fileName = `categories_${new Date().toISOString().split('T')[0]}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, json);

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(filePath, {
            mimeType: 'application/json',
            dialogTitle: 'Export Categories',
          });
        } else {
          showAlert('File saved', `Saved to: ${filePath}`);
        }
      } else {
        showAlert('File saved', `Saved to: ${filePath}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      showAlert('Failed to export categories');
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Export Data</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={24} color={colors.primary} />
          <Text style={styles.infoText}>
            Export your financial data to CSV or JSON format. You can open these files in Excel, Google Sheets, or any spreadsheet application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transactions ({transactions.length})</Text>
          <TouchableOpacity 
            style={[styles.exportButton, exporting && styles.exportButtonDisabled]} 
            onPress={exportTransactionsCSV}
            disabled={exporting}
          >
            <MaterialIcons name="table-chart" size={24} color={colors.primary} />
            <View style={styles.exportButtonText}>
              <Text style={styles.exportButtonTitle}>Export as CSV</Text>
              <Text style={styles.exportButtonSubtitle}>Compatible with Excel & Sheets</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.exportButton, exporting && styles.exportButtonDisabled]} 
            onPress={exportTransactionsJSON}
            disabled={exporting}
          >
            <MaterialIcons name="code" size={24} color={colors.primary} />
            <View style={styles.exportButtonText}>
              <Text style={styles.exportButtonTitle}>Export as JSON</Text>
              <Text style={styles.exportButtonSubtitle}>With summary statistics</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories ({categories.length})</Text>
          <TouchableOpacity 
            style={[styles.exportButton, exporting && styles.exportButtonDisabled]} 
            onPress={exportCategoriesJSON}
            disabled={exporting}
          >
            <MaterialIcons name="category" size={24} color={colors.primary} />
            <View style={styles.exportButtonText}>
              <Text style={styles.exportButtonTitle}>Export Categories</Text>
              <Text style={styles.exportButtonSubtitle}>JSON format with icons & colors</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {exporting && (
          <View style={styles.exportingContainer}>
            <Text style={styles.exportingText}>Exporting...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '15',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text,
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonText: {
    flex: 1,
  },
  exportButtonTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  exportButtonSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  exportingContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  exportingText: {
    fontSize: typography.sizes.md,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
});
