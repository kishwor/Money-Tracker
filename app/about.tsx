import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/constants/theme';

export default function AboutScreen() {
  const router = useRouter();

  const handlePrivacy = () => {
    Linking.openURL('https://himal-ai-labs.com/privacy');
  };

  const handleTerms = () => {
    Linking.openURL('https://himal-ai-labs.com/terms');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <MaterialIcons name="account-balance-wallet" size={80} color={colors.primary} />
          <Text style={styles.appName}>Money Tracker</Text>
          <Text style={styles.byLine}>by Himal AI Labs</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <View style={styles.descriptionCard}>
          <Text style={styles.description}>
            Money Tracker is a simple and powerful personal finance app designed to help you track your income and expenses, understand your spending patterns, and make better financial decisions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          
          <View style={styles.featureRow}>
            <MaterialIcons name="receipt-long" size={24} color={colors.primary} />
            <Text style={styles.featureText}>Track unlimited transactions</Text>
          </View>

          <View style={styles.featureRow}>
            <MaterialIcons name="category" size={24} color={colors.primary} />
            <Text style={styles.featureText}>Custom categories with icons & colors</Text>
          </View>

          <View style={styles.featureRow}>
            <MaterialIcons name="bar-chart" size={24} color={colors.primary} />
            <Text style={styles.featureText}>Visual reports and analytics</Text>
          </View>

          <View style={styles.featureRow}>
            <MaterialIcons name="cloud-sync" size={24} color={colors.primary} />
            <Text style={styles.featureText}>Cloud sync across devices</Text>
          </View>

          <View style={styles.featureRow}>
            <MaterialIcons name="file-download" size={24} color={colors.primary} />
            <Text style={styles.featureText}>Export data to CSV & JSON</Text>
          </View>

          <View style={styles.featureRow}>
            <MaterialIcons name="security" size={24} color={colors.primary} />
            <Text style={styles.featureText}>Secure and private</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company</Text>
          
          <View style={styles.companyCard}>
            <Text style={styles.companyName}>Himal AI Labs</Text>
            <Text style={styles.companyDescription}>
              Building intelligent financial tools to help people make smarter money decisions and achieve financial wellness.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>

          <TouchableOpacity style={styles.legalButton} onPress={handlePrivacy}>
            <Text style={styles.legalButtonText}>Privacy Policy</Text>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.legalButton} onPress={handleTerms}>
            <Text style={styles.legalButtonText}>Terms of Service</Text>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ by Himal AI Labs
          </Text>
          <Text style={styles.copyright}>
            © 2024 Himal AI Labs. All rights reserved.
          </Text>
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
  logoContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  appName: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  byLine: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  version: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  descriptionCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: typography.sizes.md,
    color: colors.text,
    lineHeight: 22,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  featureText: {
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  companyCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
  },
  companyName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  companyDescription: {
    fontSize: typography.sizes.md,
    color: colors.text,
    lineHeight: 22,
  },
  legalButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  legalButtonText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  footerText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  copyright: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
});
