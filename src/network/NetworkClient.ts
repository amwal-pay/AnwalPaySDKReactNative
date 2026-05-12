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
    secureHashValue: string,
    retryCount: number = 0,
    maxRetries: number = 2
  ): Promise<string | null> {
    console.log('🟡 [NetworkClient] fetchSessionToken called', { retryCount });
    try {
      this.logger.info('NetworkClient', 'Fetching session token', {
        environment: Environment[env],
        merchantId,
        hasCustomerId: !!customerId,
        retryCount,
      });

      const webhookUrl = this.getWebhookUrl(env);
      console.log('🟡 [NetworkClient] Webhook URL:', webhookUrl);

      const dataMap = {
        merchantId,
        customerId,
      };

      const secureHash = SecureHashUtil.clearSecureHash(
        secureHashValue,
        dataMap
      );

      console.log('🟡 [NetworkClient] About to make fetch request');
      this.logger.debug('NetworkClient', 'Making API request', {
        url: `${webhookUrl}Membership/GetSDKSessionToken`,
        method: 'POST',
      });

      // Create a timeout promise (60 seconds for better reliability)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          console.log('🔴 [NetworkClient] Timeout triggered after 60 seconds');
          reject(
            new Error('Request timeout - please check your network connection')
          );
        }, 60000);
      });

      console.log(
        '🟡 [NetworkClient] Starting Promise.race with fetch and timeout'
      );

      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(`${webhookUrl}Membership/GetSDKSessionToken`, {
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
        }),
        timeoutPromise,
      ]);

      console.log('🟡 [NetworkClient] Fetch completed, parsing response');
      const responseData = await response.json();
      console.log('🟡 [NetworkClient] Response data:', responseData);

      this.logger.debug('NetworkClient', 'API response received', {
        status: response.status,
        ok: response.ok,
        success: responseData.success,
      });

      if (response.ok && responseData.success) {
        console.log('🟢 [NetworkClient] Session token fetched successfully');
        this.logger.info('NetworkClient', 'Session token fetched successfully');
        return responseData.data.sessionToken;
      } else {
        const errorMessage =
          responseData.errorList?.join(',') || 'Unknown error';
        console.log('🔴 [NetworkClient] API request failed:', errorMessage);
        this.logger.error('NetworkClient', 'API request failed', {
          status: response.status,
          errorMessage,
          responseData,
        });

        // Retry on server errors (5xx) or specific client errors
        if (
          retryCount < maxRetries &&
          (response.status >= 500 || response.status === 408)
        ) {
          console.log(
            `🟡 [NetworkClient] Retrying request (attempt ${retryCount + 1}/${maxRetries})`
          );
          await this.delay(1000 * (retryCount + 1)); // Exponential backoff
          return this.fetchSessionToken(
            env,
            merchantId,
            customerId,
            secureHashValue,
            retryCount + 1,
            maxRetries
          );
        }

        this.showErrorDialog(errorMessage);
        return null;
      }
    } catch (error) {
      console.log('🔴 [NetworkClient] Exception caught:', error);
      this.logger.error('NetworkClient', 'Network request failed', error);

      // Retry on network errors
      if (retryCount < maxRetries) {
        console.log(
          `🟡 [NetworkClient] Retrying after error (attempt ${retryCount + 1}/${maxRetries})`
        );
        await this.delay(1000 * (retryCount + 1)); // Exponential backoff
        return this.fetchSessionToken(
          env,
          merchantId,
          customerId,
          secureHashValue,
          retryCount + 1,
          maxRetries
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Something Went Wrong';
      this.showErrorDialog(errorMessage);
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private showErrorDialog(message: string): void {
    this.logger.warn('NetworkClient', 'Showing error dialog', { message });
    Alert.alert('Error', message, [{ text: 'OK' }]);
  }
}

export default NetworkClient;
