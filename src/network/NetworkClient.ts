import { Alert } from 'react-native';
import { Environment } from '../NativeReactAmwalPay';
import SecureHashUtil from '../utils/SecureHashUtil';

class NetworkClient {
  private static instance: NetworkClient;

  private constructor() {}

  static getInstance(): NetworkClient {
    if (!NetworkClient.instance) {
      NetworkClient.instance = new NetworkClient();
    }
    return NetworkClient.instance;
  }

  private getWebhookUrl(env: Environment): string {
    switch (env) {
      case Environment.SIT:
        return 'https://test.amwalpg.com:24443/';
      case Environment.UAT:
        return 'https://test.amwalpg.com:14443/';
      case Environment.PROD:
        return 'https://webhook.amwalpg.com/';
      default:
        return 'https://test.amwalpg.com:24443/';
    }
  }

  async fetchSessionToken(
    env: Environment,
    merchantId: string,
    customerId: string | null,
    secureHashValue: string
  ): Promise<string | null> {
    try {
      const webhookUrl = this.getWebhookUrl(env);

      const dataMap = {
        merchantId,
        customerId,
      };

      const secureHash = SecureHashUtil.clearSecureHash(
        secureHashValue,
        dataMap
      );

      const response = await fetch(
        `${webhookUrl}Membership/GetSDKSessionToken`,
        {
          method: 'POST',
          headers: {
            'Accept': 'text/plain',
            'Accept-Language': 'en-US,en;q=0.9',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            merchantId,
            secureHashValue: secureHash,
            customerId,
          }),
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        return responseData.data.sessionToken;
      } else {
        const errorMessage =
          responseData.errorList?.join(',') || 'Unknown error';
        this.showErrorDialog(errorMessage);
        return null;
      }
    } catch (error) {
      this.showErrorDialog('Something Went Wrong');
      return null;
    }
  }

  private showErrorDialog(message: string): void {
    Alert.alert('Error', message, [{ text: 'OK' }]);
  }
}

export default NetworkClient;
