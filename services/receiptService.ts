const API_ENDPOINT = 'https://se6ju6ydv8.execute-api.us-east-1.amazonaws.com/chat';

export interface ReceiptData {
  amount: number;
  description: string;
  date: string;
  category?: string;
  merchant?: string;
}

export const parseReceipt = async (imageBase64: string): Promise<ReceiptData> => {
  try {
    const prompt = `You are a receipt parser. I'm sending you a receipt image. Please analyze it and extract the following information in JSON format:
{
  "amount": <total amount as number>,
  "description": "<brief description of purchase>",
  "date": "<date in YYYY-MM-DD format, use today if not visible>",
  "category": "<best matching category: Food & Dining, Shopping, Transportation, Healthcare, Entertainment, Bills & Utilities, or Other>",
  "merchant": "<store/merchant name>"
}

Image data (base64): ${imageBase64.substring(0, 100)}...

Only return the JSON object, no other text.`;

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: prompt,
        imageData: imageBase64,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.reply || data.message;

    // Parse JSON from Claude's response
    const jsonMatch = reply.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse receipt data from response');
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!parsedData.amount || !parsedData.description) {
      throw new Error('Missing required receipt information');
    }

    return {
      amount: parseFloat(parsedData.amount),
      description: parsedData.description,
      date: parsedData.date || new Date().toISOString().split('T')[0],
      category: parsedData.category || 'Other',
      merchant: parsedData.merchant,
    };
  } catch (error) {
    console.error('Receipt parsing error:', error);
    throw new Error('Failed to parse receipt. Please try again or enter manually.');
  }
};
