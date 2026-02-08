import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useReceipt } from '@/hooks/useReceipt';
import { useAccounting } from '@/hooks/useAccounting';
import { useAlert } from '@/template';
import { colors, spacing, typography } from '@/constants/theme';
import { ReceiptData } from '@/services/receiptService';

export default function ScanReceiptScreen() {
  const router = useRouter();
  const { pickImage, takePhoto, scanReceipt, loading } = useReceipt();
  const { addTransaction, categories } = useAccounting();
  const { showAlert } = useAlert();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ReceiptData | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleTakePhoto = async () => {
    const base64 = await takePhoto();
    if (base64) {
      setImageUri(`data:image/jpeg;base64,${base64}`);
      await processReceipt(base64);
    }
  };

  const handlePickImage = async () => {
    const base64 = await pickImage();
    if (base64) {
      setImageUri(`data:image/jpeg;base64,${base64}`);
      await processReceipt(base64);
    }
  };

  const processReceipt = async (base64: string) => {
    setProcessing(true);
    const data = await scanReceipt(base64);
    setProcessing(false);

    if (data) {
      setParsedData(data);
    } else {
      showAlert('Failed to parse receipt. Please try again or enter manually.');
    }
  };

  const handleSave = async () => {
    if (!parsedData) return;

    try {
      // Find matching category or use "Other"
      const matchingCategory = categories.find(
        cat => cat.type === 'expense' && cat.name.toLowerCase().includes(parsedData.category?.toLowerCase() || '')
      );

      const { error } = await addTransaction({
        type: 'expense',
        amount: parsedData.amount,
        description: parsedData.merchant 
          ? `${parsedData.merchant} - ${parsedData.description}`
          : parsedData.description,
        category_id: matchingCategory?.id,
        date: parsedData.date,
      });

      if (error) {
        showAlert(error);
        return;
      }

      showAlert('Transaction added successfully!');
      router.back();
    } catch (err) {
      showAlert('Failed to save transaction');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Receipt</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!imageUri ? (
          <View style={styles.actionContainer}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="receipt" size={80} color={colors.primary} />
            </View>
            <Text style={styles.instructionTitle}>Capture Your Receipt</Text>
            <Text style={styles.instructionText}>
              Take a photo or select from gallery. AI will automatically extract transaction details.
            </Text>

            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleTakePhoto}>
                <MaterialIcons name="camera-alt" size={24} color={colors.textOnPrimary} />
                <Text style={styles.primaryButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handlePickImage}>
                <MaterialIcons name="photo-library" size={24} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.receiptImage} resizeMode="contain" />

            {processing || loading ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.processingText}>Analyzing receipt with AI...</Text>
              </View>
            ) : parsedData ? (
              <View style={styles.dataContainer}>
                <Text style={styles.dataTitle}>Extracted Information</Text>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Amount:</Text>
                  <Text style={styles.dataValue}>${parsedData.amount.toFixed(2)}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Merchant:</Text>
                  <Text style={styles.dataValue}>{parsedData.merchant || 'N/A'}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Description:</Text>
                  <Text style={styles.dataValue}>{parsedData.description}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Category:</Text>
                  <Text style={styles.dataValue}>{parsedData.category || 'Other'}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Date:</Text>
                  <Text style={styles.dataValue}>{parsedData.date}</Text>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save Transaction</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => {
                      setImageUri(null);
                      setParsedData(null);
                    }}
                  >
                    <Text style={styles.retryButtonText}>Try Another Receipt</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color={colors.error} />
                <Text style={styles.errorText}>Failed to parse receipt</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setImageUri(null);
                    setParsedData(null);
                  }}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  actionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  instructionTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    lineHeight: 22,
  },
  buttonGroup: {
    width: '100%',
    gap: spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textOnPrimary,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    gap: spacing.sm,
  },
  secondaryButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  previewContainer: {
    gap: spacing.lg,
  },
  receiptImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  processingContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  processingText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  dataContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
  },
  dataTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dataLabel: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  dataValue: {
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: typography.weights.semibold,
    flex: 1,
    textAlign: 'right',
  },
  actionButtons: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textOnPrimary,
  },
  retryButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  errorContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.error,
    fontWeight: typography.weights.semibold,
  },
});
