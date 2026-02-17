// @ts-nocheck
import { AuthUser, SendOTPOptions, SignUpResult, GoogleSignInResult } from '../types';
import { safeSupabaseOperation, getSharedSupabaseClient } from '../../core/client';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Ensure Web platform correctly handles auth callbacks
WebBrowser.maybeCompleteAuthSession();

// Visibility change listener related variables
let lastVisibilityChange = 0;
let visibilityListener: (() => void) | null = null;

// Operation state tracking to prevent deadlock
let isUpdatingUserInOTPFlow = false;

const TIMEOUT_CONFIG = {
  AUTH_OPERATIONS: 15000,
  OTP_SEND: 30000,
  DATA_QUERIES: 10000,  
  SESSION_REFRESH: 8000,
  USER_UPDATE: 20000,
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isTimeoutErrorMessage = (message?: string): boolean => {
  if (!message) return false;
  return message.toLowerCase().includes('timeout');
};

// Utility function to add timeout to any Promise with proper cleanup
const withTimeout = <T>(
  promise: Promise<T>, 
  timeoutMs: number, 
  operation: string = 'Operation'
): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${operation} timeout after ${timeoutMs/1000} seconds`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
};

const isAuthError = (error: any): boolean => {
  if (isTimeoutErrorMessage(error.message)) return false;
  return error.status === 401 || 
         error.status === 403 || 
         error.message?.includes('invalid_token');
};

// Visibility monitoring logic - used to optimize auth event handling
const setupVisibilityMonitoring = () => {
  if (visibilityListener || Platform.OS !== 'web' || typeof document === 'undefined') {
    return;
  }

  visibilityListener = () => {
    lastVisibilityChange = Date.now();
  };

  document.addEventListener('visibilitychange', visibilityListener);
};

export const isVisibilityTriggeredAuthEvent = (event: string): boolean => {
  if (event !== 'SIGNED_IN') return false;

  const timeSinceVisibilityChange = Date.now() - lastVisibilityChange;
  return timeSinceVisibilityChange < 1000;
};

export const getLastVisibilityChange = (): number => lastVisibilityChange;

// Enhanced event filtering to prevent deadlock
export const shouldIgnoreAuthEvent = (event: string): boolean => {
  // Ignore USER_UPDATED events during updateUser operation to prevent deadlock
  if (event === 'USER_UPDATED' && isUpdatingUserInOTPFlow) {
    return true;
  }
  
  // Ignore visibility-triggered events
  if (isVisibilityTriggeredAuthEvent(event)) {
    return true;
  }
  
  return false;
};

export class AuthService {
  constructor() {
    // Initialize visibility monitoring
    setupVisibilityMonitoring();
  }

  private get supabase() {
    return getSharedSupabaseClient();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const session = await safeSupabaseOperation(async (client) => {
        const { data: { session }, error } = await withTimeout(
          client.auth.getSession(),
          TIMEOUT_CONFIG.DATA_QUERIES,
          'GetSession'
        );
        
        if (error) throw error;
        return session;
      });
      
      if (!session?.user) return null;

      // Map session.user to AuthUser (unified for all auth methods)
      return this.mapSessionToAuthUser(session.user);

    } catch (error) {
      if (isAuthError(error)) {
        return null;
      }
      
      return null;
    }
  }

  // Unified session.user mapping - used by all auth flows
  private mapSessionToAuthUser(sessionUser: any): AuthUser {
    return {
      id: sessionUser.id,
      email: sessionUser.email || '',
      username: sessionUser.user_metadata?.username || 
               sessionUser.user_metadata?.full_name || 
               sessionUser.user_metadata?.name || 
               sessionUser.email?.split('@')[0] || 
               `user_${sessionUser.id.slice(0, 8)}`,
      created_at: sessionUser.created_at,
      updated_at: sessionUser.updated_at || sessionUser.created_at,
    };
  }

  async sendOTP(email: string, options: SendOTPOptions = {}) {
    try {
      const { shouldCreateUser = true, emailRedirectTo } = options;
      const resolvedEmailRedirectTo =
        emailRedirectTo ||
        (Platform.OS === 'web' && typeof window !== 'undefined'
          ? `${window.location.origin}/login`
          : undefined);
      const signInOptions: any = { shouldCreateUser };

      if (resolvedEmailRedirectTo) {
        signInOptions.emailRedirectTo = resolvedEmailRedirectTo;
      }
      
      return await safeSupabaseOperation(async (client) => {
        const executeSendOTP = async () =>
          withTimeout(
            client.auth.signInWithOtp({
              email,
              options: signInOptions,
            }),
            TIMEOUT_CONFIG.OTP_SEND,
            'SendOTP'
          );

        let result;
        try {
          result = await executeSendOTP();
        } catch (requestError) {
          const requestErrorMessage =
            requestError instanceof Error ? requestError.message : 'Unknown sendOTP request error';

          // Retry once for transient timeout spikes
          if (isTimeoutErrorMessage(requestErrorMessage)) {
            await wait(1200);
            result = await executeSendOTP();
          } else {
            throw requestError;
          }
        }
        
        const { error } = result;
        
        if (error) {
          const lowerMessage = error.message.toLowerCase();

          if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
            return {
              error: 'Too many verification requests. Please wait 2 minutes and try again.',
              errorType: 'business',
            };
          }

          if (isTimeoutErrorMessage(error.message)) {
            return { error: 'Network is slow, please retry', errorType: 'timeout' };
          }
          return { error: error.message, errorType: 'business' };
        }
        
        return {};
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sendOTP error';
      console.warn('[Template:AuthService] SendOTP system exception:', errorMessage);
      const lowerMessage = errorMessage.toLowerCase();

      if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
        return {
          error: 'Too many verification requests. Please wait 2 minutes and try again.',
          errorType: 'business',
        };
      }
      
      if (isTimeoutErrorMessage(errorMessage)) {
        return {
          error: 'Verification email is taking longer than expected. Wait a few seconds, then retry once.',
          errorType: 'timeout'
        };
      }
      
      return { error: 'Failed to send verification code', errorType: 'network' };
    }
  }

  async resendSignupOTP(email: string, options: Pick<SendOTPOptions, 'emailRedirectTo'> = {}) {
    try {
      const { emailRedirectTo } = options;
      const resolvedEmailRedirectTo =
        emailRedirectTo ||
        (Platform.OS === 'web' && typeof window !== 'undefined'
          ? `${window.location.origin}/login`
          : undefined);

      return await safeSupabaseOperation(async (client) => {
        const { error } = await withTimeout(
          client.auth.resend({
            type: 'signup',
            email,
            ...(resolvedEmailRedirectTo
              ? {
                  options: {
                    emailRedirectTo: resolvedEmailRedirectTo,
                  },
                }
              : {}),
          }),
          TIMEOUT_CONFIG.OTP_SEND,
          'ResendSignupOTP'
        );

        if (error) {
          const lowerMessage = error.message.toLowerCase();

          if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
            return {
              error: 'Too many verification requests. Please wait 2 minutes and try again.',
              errorType: 'business',
            };
          }

          if (isTimeoutErrorMessage(error.message)) {
            return { error: 'Network is slow, please retry', errorType: 'timeout' };
          }
          return { error: error.message, errorType: 'business' };
        }

        return {};
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown resendSignupOTP error';
      console.warn('[Template:AuthService] ResendSignupOTP system exception:', errorMessage);
      const lowerMessage = errorMessage.toLowerCase();

      if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
        return {
          error: 'Too many verification requests. Please wait 2 minutes and try again.',
          errorType: 'business',
        };
      }

      if (isTimeoutErrorMessage(errorMessage)) {
        return {
          error: 'Verification email is taking longer than expected. Wait a few seconds, then retry once.',
          errorType: 'timeout',
        };
      }

      return { error: 'Failed to resend verification code', errorType: 'network' };
    }
  }

  async verifyOTPAndLogin(email: string, otp: string, options?: { password?: string }) {
    try {
      return await safeSupabaseOperation(async (client) => {
        // Step 1: Verify OTP first
        // Prefer `signup` for signup-code emails, fallback to `email` for compatibility.
        const verifyTypes: ('signup' | 'email')[] = ['signup', 'email'];
        let data: any = null;
        let error: any = null;

        for (const verifyType of verifyTypes) {
          const result = await withTimeout(
            client.auth.verifyOtp({
              email,
              token: otp,
              type: verifyType,
            }),
            TIMEOUT_CONFIG.AUTH_OPERATIONS,
            `VerifyOTP:${verifyType}`
          );

          if (!result.error) {
            data = result.data;
            error = null;
            break;
          }

          error = result.error;
          const lowerMessage = (result.error.message || '').toLowerCase();
          const shouldTryFallback =
            verifyType === 'signup' &&
            (lowerMessage.includes('invalid') ||
              lowerMessage.includes('expired') ||
              lowerMessage.includes('otp') ||
              lowerMessage.includes('token'));

          if (!shouldTryFallback) {
            break;
          }
        }

        if (error) {
          if (error.message.includes('Database error saving new user')) {
            console.warn('[Template:AuthService] Database trigger missing, auth function available but user profile creation failed');
            console.warn('[Template:AuthService] Please refer to SDK documentation to set up user_profiles table and triggers');
          }
          
          if (isTimeoutErrorMessage(error.message)) {
            return { error: 'Verification timeout, please retry', user: null, errorType: 'timeout' };
          }
          
          return { error: error.message, user: null, errorType: 'business' };
        }

        if (data.user) {
  
          // Step 2: Update user with password if provided (with deadlock prevention)
          if (options?.password) {
            try {
              // Set flag to prevent deadlock
              isUpdatingUserInOTPFlow = true;

              let passwordUpdated = false;
              let lastUpdateError: Error | null = null;
              const retryDelays = [0, 600, 1200];

              for (const delayMs of retryDelays) {
                if (delayMs > 0) {
                  await wait(delayMs);
                }

                try {
                  const { error: updateError } = await withTimeout(
                    client.auth.updateUser({ password: options.password }),
                    TIMEOUT_CONFIG.USER_UPDATE,
                    'UpdateUser'
                  );

                  if (!updateError) {
                    passwordUpdated = true;
                    break;
                  }

                  lastUpdateError = new Error(updateError.message);
                } catch (attemptError) {
                  const message = attemptError instanceof Error ? attemptError.message : 'Unknown update error';
                  lastUpdateError = new Error(message);
                }
              }

              if (!passwordUpdated) {
                console.warn(
                  '[Template:AuthService] Password setup failed after OTP verification:',
                  lastUpdateError?.message || 'Unknown update error'
                );

                // Avoid leaving the user in a half-complete authenticated state.
                await client.auth.signOut();
                isUpdatingUserInOTPFlow = false;
                return {
                  error: 'Verification succeeded, but password setup failed. Please try again.',
                  user: null,
                  errorType: 'business',
                };
              }

              // Clear flag after a delay to ensure all events are processed
              setTimeout(() => {
                isUpdatingUserInOTPFlow = false;
              }, 2000);
            } catch {
              isUpdatingUserInOTPFlow = false;
              return {
                error: 'Verification succeeded, but password setup failed. Please try again.',
                user: null,
                errorType: 'business',
              };
            }
          }

          // Standard flow: Check session status (wait a bit if we just updated user)
          if (options?.password) {
            // Wait a moment for the update to settle
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          try {
            const authUser = await this.getCurrentUser();
            
            if (authUser) {
              return { user: authUser };
            } else {
              // Final fallback: Use original verification data
              const fallbackUser: AuthUser = {
                id: data.user.id,
                email: data.user.email || '',
                username: data.user.email ? data.user.email.split('@')[0] : `user_${data.user.id.slice(0, 8)}`,
                created_at: data.user.created_at,
                updated_at: data.user.updated_at || data.user.created_at,
              };
              return { user: fallbackUser };
            }
          } catch {
            // Use fallback data
            const fallbackUser: AuthUser = {
              id: data.user.id,
              email: data.user.email || '',
              username: data.user.email ? data.user.email.split('@')[0] : `user_${data.user.id.slice(0, 8)}`,
              created_at: data.user.created_at,
              updated_at: data.user.updated_at || data.user.created_at,
            };
            return { user: fallbackUser };
          }
        }
        
        return { user: null };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown verifyOTP error';
      console.warn('[Template:AuthService] VerifyOTPAndLogin system exception:', errorMessage);
      
      // Clear flag on any error
      isUpdatingUserInOTPFlow = false;
      
      if (isTimeoutErrorMessage(errorMessage)) {
        return { error: 'Login timeout, please retry', user: null, errorType: 'timeout' };
      }
      
      return { error: 'Login failed', user: null, errorType: 'network' };
    }
  }

  async signUpWithPassword(email: string, password: string, metadata: Record<string, any> = {}): Promise<SignUpResult> {
    try {
      return await safeSupabaseOperation(async (client) => {
        const { data, error } = await withTimeout(
          client.auth.signUp({
            email,
            password,
            options: {
              data: metadata
            }
          }),
          TIMEOUT_CONFIG.AUTH_OPERATIONS,
          'SignUp'
        );

        if (error) {
          if (isTimeoutErrorMessage(error.message)) {
            return { error: 'Sign up timeout, please retry', errorType: 'timeout' };
          }
          return { error: error.message, errorType: 'business' };
        }

        if (data.user && !data.session) {
          return { 
            user: null, 
            needsEmailConfirmation: true 
          };
        }

        if (data.user && data.session) {
          try {
            const authUser = await this.getCurrentUser();
            if (authUser) {
              return { user: authUser };
            }

            // Fallback: Supabase already returned a valid user/session.
            return { user: this.mapSessionToAuthUser(data.user) };
          } catch (userError) {
            console.warn('[Template:AuthService] Error retrieving user after signup:', userError);
            return { user: this.mapSessionToAuthUser(data.user) };
          }
        }
        
        return { user: null };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown signUp error';
      console.warn('[Template:AuthService] SignUpWithPassword system exception:', errorMessage);
      
      if (isTimeoutErrorMessage(errorMessage)) {
        return { error: 'Sign up timeout, please retry', errorType: 'timeout' };
      }
      
      return { error: 'Sign up failed', errorType: 'network' };
    }
  }

  async signInWithPassword(email: string, password: string) {
    try {
      return await safeSupabaseOperation(async (client) => {
        const { data, error } = await withTimeout(
          client.auth.signInWithPassword({
            email,
            password
          }),
          TIMEOUT_CONFIG.AUTH_OPERATIONS,
          'SignIn'
        );

        if (error) {
          if (isTimeoutErrorMessage(error.message)) {
            return { error: 'Sign in timeout, please retry', user: null, errorType: 'timeout' };
          }
          return { error: error.message, user: null, errorType: 'business' };
        }

        const signedInUser = data.user || data.session?.user;

        if (signedInUser) {
          try {
            const authUser = await this.getCurrentUser();
            
            if (authUser) {
              return { user: authUser };
            } else {
              // Fallback for brief session propagation delay.
              return { user: this.mapSessionToAuthUser(signedInUser) };
            }
          } catch (userError) {
            console.warn('[Template:AuthService] Error retrieving user after sign in:', userError);
            return { user: this.mapSessionToAuthUser(signedInUser) };
          }
        }
        
        return { user: null };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown signIn error';
      console.warn('[Template:AuthService] SignInWithPassword system exception:', errorMessage);
      
      if (isTimeoutErrorMessage(errorMessage)) {
        return { error: 'Sign in timeout, please retry', user: null, errorType: 'timeout' };
      }
      
      return { error: 'Sign in failed', user: null, errorType: 'network' };
    }
  }

  async logout() {
    try {
      return await safeSupabaseOperation(async (client) => {
        const { error } = await withTimeout(
          client.auth.signOut(),
          TIMEOUT_CONFIG.AUTH_OPERATIONS,
          'Logout'
        );
        
        if (error) {
          if (isTimeoutErrorMessage(error.message)) {
            return { error: 'Logout timeout, please retry', errorType: 'timeout' };
          }
          return { error: error.message, errorType: 'business' };
        }
        
        return {};
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown logout error';
      console.warn('[Template:AuthService] Logout system exception:', errorMessage);
      
      if (isTimeoutErrorMessage(errorMessage)) {
        return { error: 'Logout timeout, please check network and retry', errorType: 'timeout' };
      }
      
      return { error: errorMessage, errorType: 'network' };
    }
  }

  async refreshSession() {
    try {
      return await safeSupabaseOperation(async (client) => {
        const { error } = await withTimeout(
          client.auth.refreshSession(),
          TIMEOUT_CONFIG.SESSION_REFRESH,
          'RefreshSession'
        );
        
        if (error) {
          if (isTimeoutErrorMessage(error.message)) {
            console.warn('[Template:AuthService] Session refresh timeout');
          } else {
            console.warn('[Template:AuthService] Refresh session error:', error);
          }
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown refresh error';
      console.warn('[Template:AuthService] RefreshSession system exception:', errorMessage);
    }
  }

  async signInWithGoogle(): Promise<GoogleSignInResult> {
    try {
      // Generate cross-platform redirect URL
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'onspaceapp',
        path: 'auth'
      });

      // Step 1: Get OAuth URL from Supabase
      const { data, error } = await withTimeout(
        this.supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: { 
              access_type: 'offline', 
              prompt: 'consent' 
            },
            skipBrowserRedirect: Platform.OS !== 'web'
          }
        }),
        TIMEOUT_CONFIG.AUTH_OPERATIONS,
        'GoogleOAuth'
      );

      if (error) {
        return { error: `OAuth init failed: ${error.message}` };
      }

      if (!data?.url) {
        return { error: 'Failed to generate OAuth URL' };
      }

      // Web platform: Supabase handles redirect automatically
      if (Platform.OS === 'web') {
        return { error: null };
      }

      // Mobile platform: Manual OAuth flow
      // Step 2: Open browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl
      );

      // Step 3: Handle callback
      if (result.type === 'success') {
        const url = result.url;
        
        try {
          const params = new URL(url).searchParams;
          const code = params.get('code');
          
          if (!code) {
            const error = params.get('error');
            const errorDescription = params.get('error_description');
            return { 
              error: errorDescription || error || 'No authorization code received'
            };
          }

          // Exchange code for session - this triggers SIGNED_IN event
          const { error: exchangeError } = await withTimeout(
            this.supabase.auth.exchangeCodeForSession(code),
            TIMEOUT_CONFIG.AUTH_OPERATIONS,
            'ExchangeCode'
          );

          if (exchangeError) {
            return { 
              error: `Session exchange failed: ${exchangeError.message}`
            };
          }

          // CRITICAL: Don't poll and wait here!
          // exchangeCodeForSession will trigger onAuthStateChange(SIGNED_IN)
          // Just verify session exists and return immediately
          const { data: sessionData } = await this.supabase.auth.getSession();
          if (sessionData.session) {
            // Session created successfully, AuthContext will update via onAuthStateChange
            return { error: null };
          }

          // If no session yet, wait briefly for it to settle
          await new Promise(resolve => setTimeout(resolve, 500));
          const { data: retrySessionData } = await this.supabase.auth.getSession();
          if (retrySessionData.session) {
            return { error: null };
          }

          // Last resort: refresh to trigger state change
          await this.supabase.auth.refreshSession();
          return { error: null };
        } catch (urlError) {
          const errorMsg = urlError instanceof Error ? urlError.message : 'Unknown error';
          return { 
            error: `Failed to parse callback: ${errorMsg}`
          };
        }
      } else if (result.type === 'cancel') {
        return { error: 'User cancelled login' };
      } else if (result.type === 'dismiss') {
        return { error: 'Browser dismissed' };
      } else if (result.type === 'locked') {
        return { error: 'Browser is locked' };
      }

      return { 
        error: `Unknown result: ${result.type}`
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown Google login error';
      
      if (isTimeoutErrorMessage(errorMessage)) {
        return { error: 'Google login timeout, please retry' };
      }
      
      return { 
        error: `Google login failed: ${errorMessage}`
      };
    }
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    try {
      const { data: { subscription } } = this.supabase.auth.onAuthStateChange(
        async (event, session) => {
          // Use enhanced event filtering to prevent deadlock
          if (shouldIgnoreAuthEvent(event)) {
            return;
          }
          
          if (session?.user) {
            try {
              const authUser = this.mapSessionToAuthUser(session.user);
              callback(authUser);
            } catch (error) {
              console.warn('[Template:AuthService] Error in auth state change callback:', error);
              callback(null);
            }
          } else {
            callback(null);
          }
        }
      );

      return subscription;
    } catch (error) {
      console.error('[Template:AuthService] Failed to set up auth state listener:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
