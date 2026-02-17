import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth, useAlert } from '@/template';
import { colors, spacing, typography } from '@/constants/theme';

const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_RATE_LIMIT_COOLDOWN_SECONDS = 120;
const ENABLE_OTP_COOLDOWN = !__DEV__;
const ENABLE_DEV_DIRECT_SIGNUP = __DEV__ && process.env.EXPO_PUBLIC_DEV_DIRECT_SIGNUP === 'true';
const OTP_MAX_LENGTH = 8;

export default function AuthScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState(0);
  const [otpFlowMode, setOtpFlowMode] = useState<'signup' | 'existing_user'>('signup');

  const { user, signInWithPassword, signUpWithPassword, sendOTP, resendSignupOTP, verifyOTPAndLogin, operationLoading } = useAuth();
  const { showAlert } = useAlert();
  const userId = user?.id;
  const isCooldownActive = ENABLE_OTP_COOLDOWN && otpCooldownSeconds > 0;

  useEffect(() => {
    if (userId) {
      router.replace('/' as any);
    }
  }, [userId, router]);

  useEffect(() => {
    if (!ENABLE_OTP_COOLDOWN || otpCooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setOtpCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [otpCooldownSeconds]);

  const startOTPCooldown = (seconds = OTP_RESEND_COOLDOWN_SECONDS) => {
    if (!ENABLE_OTP_COOLDOWN) return;
    setOtpCooldownSeconds(seconds);
  };

  const normalizeOTPInput = (value: string) => {
    return value.replace(/\D/g, '').slice(0, OTP_MAX_LENGTH);
  };

  const isRateLimitError = (message: string) => {
    const lower = message.toLowerCase();
    return lower.includes('too many verification requests') || lower.includes('rate limit') || lower.includes('too many requests');
  };

  const isAlreadyRegisteredError = (message: string) => {
    const lower = message.toLowerCase();
    return lower.includes('already registered') || lower.includes('already been registered');
  };

  const isEmailNotConfirmedError = (message: string) => {
    const lower = message.toLowerCase();
    return lower.includes('email not confirmed') || lower.includes('not confirmed');
  };

  const showErrorAlert = (message: string) => {
    showAlert('Error', message);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Please fill in all fields');
      return;
    }

    const { error } = await signInWithPassword(email, password);
    if (error) {
      if (isEmailNotConfirmedError(error)) {
        setIsLogin(false);
        setShowOtpInput(false);
        setOtp('');
        setOtpFlowMode('signup');
        showAlert('User not registered', 'This email is not verified for login yet. Go to Sign Up and complete OTP verification.');
        return;
      }

      showErrorAlert(error);
      return;
    }

    router.replace('/' as any);
  };

  const handleSendOTP = async () => {
    if (ENABLE_DEV_DIRECT_SIGNUP) {
      const { error, needsEmailConfirmation } = await signUpWithPassword(email, password);
      if (error) {
        showErrorAlert(error);
        return;
      }

      if (needsEmailConfirmation) {
        showAlert('Account created', 'Check your email to confirm your account, then log in.');
        setIsLogin(true);
        setShowOtpInput(false);
        setOtp('');
        return;
      }

      router.replace('/' as any);
      return;
    }

    if (isCooldownActive) {
      showAlert(`Please wait ${otpCooldownSeconds}s before requesting another code.`);
      return;
    }

    if (!email || !password || !confirmPassword) {
      showAlert('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showAlert('Password must be at least 6 characters');
      return;
    }

    const { error, needsEmailConfirmation, user: signedUpUser } = await signUpWithPassword(email, password);
    if (error) {
      if (isRateLimitError(error)) {
        startOTPCooldown(OTP_RATE_LIMIT_COOLDOWN_SECONDS);
        showAlert('Too many requests', 'Please wait 2 minutes before requesting another code.');
        return;
      }

      if (isAlreadyRegisteredError(error)) {
        const otpResult = await sendOTP(email);
        if (otpResult.error) {
          if (isRateLimitError(otpResult.error)) {
            startOTPCooldown(OTP_RATE_LIMIT_COOLDOWN_SECONDS);
            showAlert('Too many requests', 'Please wait 2 minutes before requesting another code.');
            return;
          }

          showErrorAlert(otpResult.error);
          return;
        }

        setOtpFlowMode('existing_user');
        startOTPCooldown();
        setShowOtpInput(true);
        showAlert('Account already exists. Enter the code from email to verify this account and set your password.');
        return;
      }

      showErrorAlert(error);
      return;
    }

    if (signedUpUser && !needsEmailConfirmation) {
      router.replace('/' as any);
      return;
    }

    if (needsEmailConfirmation) {
      setOtpFlowMode('signup');
      startOTPCooldown();
      setShowOtpInput(true);
      showAlert('Verification code sent to your email. Enter the code in the app (do not use the email link).');
      return;
    }

    showAlert('Please check your email for the verification code.');
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      showAlert('Please enter verification code');
      return;
    }

    const verifyOptions =
      otpFlowMode === 'existing_user'
        ? { password }
        : undefined;

    const { error } = await verifyOTPAndLogin(email, otp, verifyOptions);
    if (error) {
      showErrorAlert(error);
      return;
    }

    router.replace('/' as any);
  };

  const handleResendOTP = async () => {
    if (isCooldownActive) {
      showAlert(`Please wait ${otpCooldownSeconds}s before resending the code.`);
      return;
    }

    const resendResult =
      otpFlowMode === 'existing_user'
        ? await sendOTP(email)
        : await resendSignupOTP(email);
    const { error } = resendResult;
    if (error) {
      if (isRateLimitError(error)) {
        startOTPCooldown(OTP_RATE_LIMIT_COOLDOWN_SECONDS);
        showAlert('Too many requests', 'Please wait 2 minutes before requesting another code.');
        return;
      }

      showErrorAlert(error);
      return;
    }

    startOTPCooldown();
    showAlert('A new code was sent. Enter the code in the app (do not use the email link).');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <MaterialIcons name="account-balance-wallet" size={64} color={colors.primary} />
            <Text style={styles.title}>
              Money Tracker{"\n"}
              <Text style={styles.byLine}>by Himal AI Labs</Text>
            </Text>
            <Text style={styles.subtitle}>Track your finances easily</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, isLogin && styles.activeTab]}
                onPress={() => {
                  setIsLogin(true);
                  setShowOtpInput(false);
                  setOtpFlowMode('signup');
                  setOtp('');
                }}
              >
                <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, !isLogin && styles.activeTab]}
                onPress={() => {
                  setIsLogin(false);
                  setShowOtpInput(false);
                  setOtpFlowMode('signup');
                  setOtp('');
                }}
              >
                <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!operationLoading && !showOtpInput}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!operationLoading && !showOtpInput}
              />
            </View>

            {!isLogin && !showOtpInput && (
              <View style={styles.inputContainer}>
                <MaterialIcons name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!operationLoading}
                />
              </View>
            )}

            {!isLogin && showOtpInput && (
              <>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="verified-user" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Verification Code"
                    placeholderTextColor={colors.textSecondary}
                    value={otp}
                    onChangeText={(value) => setOtp(normalizeOTPInput(value))}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    maxLength={OTP_MAX_LENGTH}
                    editable={!operationLoading}
                  />
                </View>
                <Text style={styles.otpHint}>Enter the code from your email. Do not open the email link.</Text>
                <TouchableOpacity
                  style={[
                    styles.resendButton,
                    (operationLoading || isCooldownActive) && styles.resendButtonDisabled,
                  ]}
                  onPress={handleResendOTP}
                  disabled={operationLoading || isCooldownActive}
                >
                  <Text
                    style={[
                      styles.resendText,
                      (operationLoading || isCooldownActive) && styles.resendTextDisabled,
                    ]}
                  >
                    {operationLoading ? 'Sending...' : isCooldownActive ? `Resend in ${otpCooldownSeconds}s` : 'Resend code'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {isLogin ? (
              <TouchableOpacity
                style={[styles.button, operationLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={operationLoading}
              >
                <Text style={styles.buttonText}>{operationLoading ? 'Logging in...' : 'Login'}</Text>
              </TouchableOpacity>
            ) : showOtpInput ? (
              <TouchableOpacity
                style={[styles.button, operationLoading && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={operationLoading}
              >
                <Text style={styles.buttonText}>{operationLoading ? 'Verifying...' : 'Verify & Sign Up'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, (operationLoading || isCooldownActive) && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={operationLoading || isCooldownActive}
              >
                <Text style={styles.buttonText}>
                  {operationLoading
                    ? ENABLE_DEV_DIRECT_SIGNUP
                      ? 'Creating...'
                      : 'Sending...'
                    : ENABLE_DEV_DIRECT_SIGNUP
                      ? 'Create Account (Dev)'
                      : isCooldownActive
                        ? `Try again in ${otpCooldownSeconds}s`
                        : 'Send Verification Code'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  byLine: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.textOnPrimary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  otpHint: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  resendButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
  resendText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  resendTextDisabled: {
    color: colors.textSecondary,
  },
  placeholderTextColor: {
    color: colors.textSecondary,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
  buttonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textOnPrimary,
  },
});
