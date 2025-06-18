import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  AmwalPaySDK,
  Environment,
  Currency,
  TransactionType,
  type AmwalPayConfig,
} from 'react-amwal-pay';

export const PaymentScreen: React.FC = () => {
  const [customerId, setCustomerId] = useState<string|null>(null);
  const [config, setConfig] = useState<Partial<AmwalPayConfig>>({
    environment: Environment.SIT,
    currency: Currency.OMR,
    transactionType: TransactionType.CARD_WALLET,
    locale: 'en',
    merchantId: '84131',
    terminalId: '811018',
    amount: '1',
    secureHash:
      '8570CEED656C8818E4A7CE04F22206358F272DAD5F0227D322B654675ABF8F83',
     onCustomerId(customerId) {
      setCustomerId(customerId);
      console.log('Customer ID:', customerId);
    },
    onResponse(response) {
      console.log('Payment Response:', response);
    },
  });

  const handleInitializePayment = async () => {
    try {
      if (!isConfigValid()) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      config.customerId = customerId;
      const amwalPay = AmwalPaySDK.getInstance();
      await amwalPay.startPayment(config as AmwalPayConfig);
    } catch (e) {
      Alert.alert('Error', 'Error starting payment');
      console.log(e);
    }
  };

  const isConfigValid = (): boolean => {
    return Boolean(
      config.environment &&
        config.secureHash &&
        config.currency &&
        config.amount &&
        config.merchantId &&
        config.terminalId &&
        config.locale &&
        config.transactionType
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Payment Configuration</Text>
        <ClearCustomerIdButton onPress={() => setCustomerId(null)} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.label}>Environment</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={config.environment}
            onValueChange={(value) =>
              setConfig({ ...config, environment: value as Environment })
            }
          >
            {Object.values(Environment).map((env) => (
              <Picker.Item key={env} label={env} value={env} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Secure Hash</Text>
        <TextInput
          style={styles.input}
          value={config.secureHash}
          onChangeText={(value) => setConfig({ ...config, secureHash: value })}
          placeholder="Enter Secure Hash"
        />

        <Text style={styles.label}>Currency</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={config.currency}
            onValueChange={(value) =>
              setConfig({ ...config, currency: value as Currency })
            }
          >
            {Object.values(Currency).map((curr) => (
              <Picker.Item key={curr} label={curr} value={curr} />
            ))}
          </Picker>
        </View>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          value={config.amount}
          onChangeText={(value) => setConfig({ ...config, amount: value })}
          placeholder="Enter amount"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Merchant ID</Text>
        <TextInput
          style={styles.input}
          value={config.merchantId}
          onChangeText={(value) => setConfig({ ...config, merchantId: value })}
          placeholder="Enter merchant ID"
        />

        <Text style={styles.label}>Terminal ID</Text>
        <TextInput
          style={styles.input}
          value={config.terminalId}
          onChangeText={(value) => setConfig({ ...config, terminalId: value })}
          placeholder="Enter terminal ID"
        />

        <Text style={styles.label}>Transaction Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={config.transactionType}
            onValueChange={(value) =>
              setConfig({
                ...config,
                transactionType: value as TransactionType,
              })
            }
          >
            {Object.values(TransactionType).map((type) => (
              <Picker.Item key={type} label={type} value={type} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleInitializePayment}
        >
          <Text style={styles.buttonText}>Start Payment</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f7f7f7',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  appBarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  appBarButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  appBarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 32,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%', // Adjust width as needed
    maxWidth: 300, // Optional: Limit max width
  },
});

// Add this component before the styles
// Update ClearCustomerIdButton to accept onPress
const ClearCustomerIdButton = ({ onPress }: { onPress?: () => void }) => (
  <TouchableOpacity
    style={styles.appBarButton}
    onPress={async () => {
      Alert.alert('Customer ID cleared');
      if (onPress) onPress();
    }}
    accessibilityLabel="Clear Customer ID"
  >
    <Text style={{ fontSize: 20, color: '#e74c3c' }}>🗑️</Text>
  </TouchableOpacity>
);
