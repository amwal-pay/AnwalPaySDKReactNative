import HmacSHA256 from 'crypto-js/hmac-sha256';
import Hex from 'crypto-js/enc-hex';

type DataMap = { [key: string]: string | null };

class SecureHashUtil {
  static clearSecureHash(secretKey: string, data: DataMap): string {
    delete data.secureHashValue;
    const concatenatedString = this.composeData(data);
    return this.generateSecureHash(concatenatedString, secretKey);
  }

  private static composeData(requestParameters: DataMap): string {
    return Object.entries(requestParameters)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .filter(([_, value]) => value != null && value !== '')
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  }

  private static generateSecureHash(
    message: string,
    secretKey: string
  ): string {
    try {
      // Convert hex string to byte array
      const keyBytes = secretKey
        .match(/.{2}/g)
        ?.map((byte) => parseInt(byte, 16));

      if (!keyBytes) {
        throw new Error('Invalid secret key format');
      }

      // Convert key bytes to hex string for crypto-js
      const keyHex = keyBytes
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');

      // Generate HMAC-SHA256
      const hash = HmacSHA256(message, Hex.parse(keyHex));

      // Convert to uppercase hex string
      return hash.toString(Hex).toUpperCase();
    } catch (e) {
      console.error('Error generating secure hash:', e);
      return '';
    }
  }
}

export default SecureHashUtil;
