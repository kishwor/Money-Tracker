// @ts-nocheck
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoCrypto from 'expo-crypto';
import 'react-native-url-polyfill/auto';

class SupabaseManager {
  private static instance: SupabaseClient | null = null;
  private static creating = false;
  private static creationCount = 0;

  private static ensurePKCECryptoSupport() {
    if (Platform.OS === 'web') return;

    const globalAny = globalThis as any;

    if (!globalAny.crypto) {
      globalAny.crypto = {};
    }

    if (typeof globalAny.crypto.getRandomValues !== 'function') {
      globalAny.crypto.getRandomValues = (typedArray: any) => ExpoCrypto.getRandomValues(typedArray);
    }

    if (typeof globalAny.crypto.randomUUID !== 'function') {
      globalAny.crypto.randomUUID = () => ExpoCrypto.randomUUID();
    }

    if (!globalAny.crypto.subtle) {
      globalAny.crypto.subtle = {};
    }

    if (typeof globalAny.crypto.subtle.digest !== 'function') {
      globalAny.crypto.subtle.digest = async (algorithm: any, data: BufferSource) => {
        const name = typeof algorithm === 'string' ? algorithm : algorithm?.name;
        const normalized = String(name || '').toUpperCase().replace(/-/g, '');
        const digestMap: Record<string, ExpoCrypto.CryptoDigestAlgorithm> = {
          SHA1: ExpoCrypto.CryptoDigestAlgorithm.SHA1,
          SHA256: ExpoCrypto.CryptoDigestAlgorithm.SHA256,
          SHA384: ExpoCrypto.CryptoDigestAlgorithm.SHA384,
          SHA512: ExpoCrypto.CryptoDigestAlgorithm.SHA512,
        };

        const expoAlgorithm = digestMap[normalized];
        if (!expoAlgorithm) {
          throw new Error(`[Template:Client] Unsupported digest algorithm: ${name}`);
        }

        return ExpoCrypto.digest(expoAlgorithm, data);
      };
    }
  }

  static getClient(): SupabaseClient {

    if (this.instance) {
      return this.instance;
    }

    if (this.creating) {
      throw new Error('[Template:Client] Client is being created, please wait');
    }

    this.creating = true;
    this.creationCount++;
    
    try {
      console.log(`[Template:Client] Creating Supabase client instance #${this.creationCount}`);
      
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        const errorMsg = '[Template:Client] Supabase environment variables missing\n' +
          'Please check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env file';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      if (this.creationCount > 1) {
        console.warn(`[Template:Client] ⚠️ Multiple client creation detected! This is creation #${this.creationCount}`);
        console.warn('[Template:Client] This may indicate a development environment hot reload or architecture issue.');
      }

      this.ensurePKCECryptoSupport();
      
      this.instance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: this.createStorageAdapter(),
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: Platform.OS === 'web',
          flowType: 'pkce',
        },
      });
      
      console.log('[Template:Client] Supabase client created successfully');
      return this.instance;
      
    } finally {
      this.creating = false;
    }
  }

  private static createStorageAdapter = () => {
    if (Platform.OS === 'web') {
      return {
        getItem: (key: string) => {
          if (typeof window !== 'undefined' && window.localStorage) {
            return Promise.resolve(window.localStorage.getItem(key));
          }
          return Promise.resolve(null);
        },
        setItem: (key: string, value: string) => {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(key, value);
            return Promise.resolve();
          }
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(key);
            return Promise.resolve();
          }
          return Promise.resolve();
        },
      };
    } else {
      return AsyncStorage;
    }
  }
}

export const getSharedSupabaseClient = (): SupabaseClient => {
  return SupabaseManager.getClient();
};

export const safeSupabaseOperation = async <T>(
  operation: (client: SupabaseClient) => Promise<T>
): Promise<T> => {
  const client = getSharedSupabaseClient();
  return await operation(client);
};
