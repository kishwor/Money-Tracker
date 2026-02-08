import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { parseReceipt, ReceiptData } from '@/services/receiptService';

export function useReceipt() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async (): Promise<string | null> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Permission to access gallery is required');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        return result.assets[0].base64;
      }

      return null;
    } catch (err) {
      setError('Failed to select image');
      return null;
    }
  };

  const takePhoto = async (): Promise<string | null> => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Permission to access camera is required');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        return result.assets[0].base64;
      }

      return null;
    } catch (err) {
      setError('Failed to take photo');
      return null;
    }
  };

  const scanReceipt = async (imageBase64: string): Promise<ReceiptData | null> => {
    setLoading(true);
    setError(null);

    try {
      const data = await parseReceipt(imageBase64);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to scan receipt';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    pickImage,
    takePhoto,
    scanReceipt,
  };
}
