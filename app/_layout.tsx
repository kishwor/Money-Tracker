import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider, AuthProvider } from '@/template';
import { AccountingProvider } from '@/contexts/AccountingContext';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <AccountingProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="login" />
              <Stack.Screen 
                name="add-transaction" 
                options={{ 
                  presentation: 'modal',
                  animation: 'slide_from_bottom'
                }} 
              />
              <Stack.Screen 
                name="scan-receipt" 
                options={{ 
                  presentation: 'modal',
                  animation: 'slide_from_bottom'
                }} 
              />
              <Stack.Screen name="manage-categories" />
              <Stack.Screen name="export-data" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="help-support" />
              <Stack.Screen name="about" />
            </Stack>
          </AccountingProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
