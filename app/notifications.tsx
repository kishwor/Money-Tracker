import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/constants/theme';

export default function NotificationsScreen() {
  const router = useRouter();
  const [dailyReminder, setDailyReminder] = useState(false);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <MaterialIcons name="notifications-active" size={24} color={colors.primary} />
          <Text style={styles.infoText}>
            Stay on top of your finances with timely notifications and reminders.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="alarm" size={24} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Daily Reminder</Text>
                <Text style={styles.settingSubtitle}>Get reminded to log your expenses</Text>
              </View>
            </View>
            <Switch
              value={dailyReminder}
              onValueChange={setDailyReminder}
              trackColor={{ false: colors.disabled, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="receipt" size={24} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Transaction Alerts</Text>
                <Text style={styles.settingSubtitle}>Notify when transactions are added</Text>
              </View>
            </View>
            <Switch
              value={transactionAlerts}
              onValueChange={setTransactionAlerts}
              trackColor={{ false: colors.disabled, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="warning" size={24} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Budget Alerts</Text>
                <Text style={styles.settingSubtitle}>Alert when approaching budget limits</Text>
              </View>
            </View>
            <Switch
              value={budgetAlerts}
              onValueChange={setBudgetAlerts}
              trackColor={{ false: colors.disabled, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reports</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="bar-chart" size={24} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Weekly Report</Text>
                <Text style={styles.settingSubtitle}>Receive weekly spending summary</Text>
              </View>
            </View>
            <Switch
              value={weeklyReport}
              onValueChange={setWeeklyReport}
              trackColor={{ false: colors.disabled, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        <View style={styles.noteCard}>
          <MaterialIcons name="info-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.noteText}>
            Note: These settings are saved locally on your device.
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  noteCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  noteText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
