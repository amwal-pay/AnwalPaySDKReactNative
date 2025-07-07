/**
 * UUID utility for generating unique transaction IDs
 * Similar to Dart's Uuid().v1() but using standard UUID v4 format
 */
export class UuidUtil {
  /**
   * Generates a UUID v4 string (random-based)
   * This provides similar functionality to Dart's Uuid().v1()
   * @returns A lowercase UUID string
   */
  static generateV4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }).toLowerCase();
  }

  /**
   * Generates a transaction ID for Amwal payments
   * @returns A lowercase UUID string suitable for transaction identification
   */
  static generateTransactionId(): string {
    return UuidUtil.generateV4();
  }
} 