import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAlert } from '@/template';
import { colors, spacing, typography } from '@/constants/theme';

export default function HelpSupportScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();

  const handleEmail = () => {
    Linking.openURL('mailto:support@himal-ai-labs.com?subject=Money Tracker Support');
  };

  const handleWebsite = () => {
    Linking.openURL('https://himal-ai-labs.com');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          <View style={styles.faqCard}>
            <Text style={styles.faqQuestion}>How do I add a transaction?</Text>
            <Text style={styles.faqAnswer}>
              Tap the + button on the Transactions screen, select income or expense, enter the amount, choose a category, and tap Save.
            </Text>
          </View>

          <View style={styles.faqCard}>
            <Text style={styles.faqQuestion}>Can I edit or delete transactions?</Text>
            <Text style={styles.faqAnswer}>
              Yes! On the Transactions screen, tap the delete icon on any transaction to remove it. You can add a new one to replace it if needed.
            </Text>
          </View>

          <View style={styles.faqCard}>
            <Text style={styles.faqQuestion}>How do I create custom categories?</Text>
            <Text style={styles.faqAnswer}>
              Go to Profile → Manage Categories → tap the + icon. Choose a name, type (income/expense), icon, and color for your category.
            </Text>
          </View>

          <View style={styles.faqCard}>
            <Text style={styles.faqQuestion}>How can I export my data?</Text>
            <Text style={styles.faqAnswer}>
              Navigate to Profile → Export Data. You can export transactions in CSV format (for Excel/Sheets) or JSON format with detailed statistics.
            </Text>
          </View>

          <View style={styles.faqCard}>
            <Text style={styles.faqQuestion}>Is my data secure?</Text>
            <Text style={styles.faqAnswer}>
              Yes! Your data is stored securely in the cloud with encryption. Only you can access your financial information using your login credentials.
            </Text>
          </View>

          <View style={styles.faqCard}>
            <Text style={styles.faqQuestion}>Can I use the app offline?</Text>
            <Text style={styles.faqAnswer}>
              The app requires an internet connection to sync your data. Changes made offline will sync automatically when you are back online.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>

          <TouchableOpacity style={styles.contactCard} onPress={handleEmail}>
            <View style={styles.contactLeft}>
              <MaterialIcons name="email" size={24} color={colors.primary} />
              <View>
                <Text style={styles.contactTitle}>Email Support</Text>
                <Text style={styles.contactSubtitle}>support@himal-ai-labs.com</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleWebsite}>
            <View style={styles.contactLeft}>
              <MaterialIcons name="language" size={24} color={colors.primary} />
              <View>
                <Text style={styles.contactTitle}>Visit Website</Text>
                <Text style={styles.contactSubtitle}>himal-ai-labs.com</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Getting Started</Text>
          
          <View style={styles.tipCard}>
            <MaterialIcons name="lightbulb" size={24} color={colors.primary} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Quick Start Tips</Text>
              <Text style={styles.tipText}>
                • Add your first transaction to get started{'\n'}
                • Set up custom categories for better tracking{'\n'}
                • Check Reports tab to see your spending patterns{'\n'}
                • Export data regularly for backup
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  faqCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  faqQuestion: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  faqAnswer: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  contactTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  contactSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '15',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.md,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tipText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    lineHeight: 20,
  },
});
