import { Alert } from 'react-native';
import { Environment } from '../NativeReactAmwalPay';
import SecureHashUtil from '../utils/SecureHashUtil';
import Logger from '../utils/Logger';

class NetworkClient {
  private static instance: NetworkClient;
  private logger: Logger;

  private constructor() {
    this.logger = Logger.getInstance();
  }

  static getInstance(): NetworkClient {
    if (!NetworkClient.instance) {
      NetworkClient.instance = new NetworkClient();
    }
    return NetworkClient.instance;
  }

  private getWebhookUrl(env: Environment): string {
    const urls = {
      [Environment.SIT]: 'https://test.amwalpg.com:24443/',
      [Environment.UAT]: 'https://test.amwalpg.com:14443/',
      [Environment.PROD]: 'https://webhook.amwalpg.com/',
    };

    const url = urls[env] || urls[Environment.SIT];
    this.logger.debug(
      'NetworkClient',
      `Using webhook URL for ${Environment[env]}`,
      { url }
    );
    return url;
  }

  async fetchSessionToken(
    env: Environment,
    merchantId: string,
    customerId: string | null,
    secureHashValue: string
  ): Promise<string | null> {
    try {
      this.logger.info('NetworkClient', 'Fetching session token', {
        environment: Environment[env],
        merchantId,
        hasCustomerId: !!customerId,
      });

      const webhookUrl = this.getWebhookUrl(env);

      const dataMap = {
        merchantId,
        customerId,
      };

      const secureHash = SecureHashUtil.clearSecureHash(
        secureHashValue,
        dataMap
      );

      this.logger.debug('NetworkClient', 'Making API request', {
        url: `${webhookUrl}Membership/GetSDKSessionToken`,
        method: 'POST',
      });

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

      this.logger.debug('NetworkClient', 'API response received', {
        status: response.status,
        ok: response.ok,
        success: responseData.success,
      });

      if (response.ok && responseData.success) {
        this.logger.info('NetworkClient', 'Session token fetched successfully');
        return responseData.data.sessionToken;
      } else {
        const errorMessage =
          responseData.errorList?.join(',') || 'Unknown error';
        this.logger.error('NetworkClient', 'API request failed', {
          status: response.status,
          errorMessage,
          responseData,
        });
        this.showErrorDialog(errorMessage);
        return null;
      }
    } catch (error) {
      this.logger.error('NetworkClient', 'Network request failed', error);
      this.showErrorDialog('Something Went Wrong');
      return null;
    }
  }

  private showErrorDialog(message: string): void {
    this.logger.warn('NetworkClient', 'Showing error dialog', { message });
    Alert.alert('Error', message, [{ text: 'OK' }]);
  }
}

export default NetworkClient;
