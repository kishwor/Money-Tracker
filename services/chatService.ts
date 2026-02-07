const API_ENDPOINT = 'https://se6ju6ydv8.execute-api.us-east-1.amazonaws.com/chat';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const sendMessage = async (message: string): Promise<string> => {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.reply || data.message || 'No response from AI';
  } catch (error) {
    console.error('Chat API error:', error);
    throw new Error('Failed to get response from AI assistant');
  }
};
