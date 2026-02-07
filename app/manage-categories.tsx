import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAccounting } from '@/hooks/useAccounting';
import { useAlert } from '@/template';
import { colors, spacing, typography } from '@/constants/theme';
import { Category } from '@/services/categoryService';

const ICON_OPTIONS = [
  'restaurant', 'shopping-cart', 'local-gas-station', 'home', 'medical-services',
  'school', 'fitness-center', 'movie', 'card-giftcard', 'flight',
  'directions-car', 'phone', 'computer', 'pets', 'work',
  'attach-money', 'business', 'cake', 'child-care', 'favorite'
];

const COLOR_OPTIONS = [
  colors.primary, colors.income, colors.expense, colors.error,
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E2', '#F8B739', '#52B788', '#EF476F'
];

export default function ManageCategoriesScreen() {
  const router = useRouter();
  const { categories, addCategory, removeCategory } = useAccounting();
  const { showAlert } = useAlert();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    icon: 'shopping-cart',
    color: colors.primary,
  });

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      type: 'expense',
      icon: 'shopping-cart',
      color: colors.primary,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showAlert('Please enter a category name');
      return;
    }

    try {
      await addCategory(formData.name, formData.type, formData.icon, formData.color);
      showAlert('Category added successfully');
      setModalVisible(false);
    } catch (error: any) {
      showAlert(error?.message || 'Failed to add category');
    }
  };

  const handleDelete = (category: Category) => {
    showAlert('Delete Category', `Delete "${category.name}"? Transactions will become uncategorized.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeCategory(category.id);
            showAlert('Category deleted');
          } catch (error) {
            showAlert('Failed to delete category');
          }
        },
      },
    ]);
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  const renderCategory = ({ item }: { item: Category }) => (
    <View style={styles.categoryCard}>
      <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
        <MaterialIcons name={item.icon as any} size={28} color={item.color} />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryType}>{item.type}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <MaterialIcons name="delete" size={22} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Categories</Text>
        <TouchableOpacity onPress={handleOpenAdd}>
          <MaterialIcons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Categories ({expenseCategories.length})</Text>
          <FlatList
            data={expenseCategories}
            keyExtractor={item => item.id}
            renderItem={renderCategory}
            scrollEnabled={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Income Categories ({incomeCategories.length})</Text>
          <FlatList
            data={incomeCategories}
            keyExtractor={item => item.id}
            renderItem={renderCategory}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Category</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Category name"
                value={formData.name}
                onChangeText={name => setFormData(prev => ({ ...prev, name }))}
              />

              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeButton, formData.type === 'expense' && styles.typeButtonActive]}
                  onPress={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                >
                  <Text style={[styles.typeButtonText, formData.type === 'expense' && styles.typeButtonTextActive]}>
                    Expense
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, formData.type === 'income' && styles.typeButtonActiveIncome]}
                  onPress={() => setFormData(prev => ({ ...prev, type: 'income' }))}
                >
                  <Text style={[styles.typeButtonText, formData.type === 'income' && styles.typeButtonTextActive]}>
                    Income
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Icon</Text>
              <View style={styles.iconGrid}>
                {ICON_OPTIONS.map(icon => (
                  <TouchableOpacity
                    key={icon}
                    style={[styles.iconOption, formData.icon === icon && styles.iconOptionActive]}
                    onPress={() => setFormData(prev => ({ ...prev, icon }))}
                  >
                    <MaterialIcons name={icon as any} size={24} color={formData.icon === icon ? colors.textOnPrimary : colors.text} />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Color</Text>
              <View style={styles.colorGrid}>
                {COLOR_OPTIONS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorOption, { backgroundColor: color }, formData.color === color && styles.colorOptionActive]}
                    onPress={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Category</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  categoryType: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.expense,
    borderColor: colors.expense,
  },
  typeButtonActiveIncome: {
    backgroundColor: colors.income,
    borderColor: colors.income,
  },
  typeButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  typeButtonTextActive: {
    color: colors.textOnPrimary,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  iconOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionActive: {
    borderColor: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  saveButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textOnPrimary,
  },
});
