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
  Modal,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  AmwalPaySDK,
  Environment,
  Currency,
  TransactionType,
  type AmwalPayConfig,
} from 'react-amwal-pay';

interface ModalPickerProps {
  visible: boolean;
  selectedValue: string | undefined;
  onValueChange: (value: string) => void;
  onClose: () => void;
  items: Array<{ label: string; value: string }>;
  title: string;
}

const ModalPicker: React.FC<ModalPickerProps> = ({
  visible,
  selectedValue,
  onValueChange,
  onClose,
  items,
  title,
}) => {
  console.log('ModalPicker rendered with items:', items);
  console.log('Items length:', items.length);
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.modalListItem,
                  selectedValue === item.value && styles.modalListItemSelected
                ]}
                onPress={() => {
                  onValueChange(item.value);
                  onClose();
                }}
              >
                <Text style={[
                  styles.modalListItemText,
                  selectedValue === item.value && styles.modalListItemTextSelected
                ]}>
                  {item.label}
                </Text>
                {selectedValue === item.value && (
                  <Text style={styles.modalListItemCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export const PaymentScreen: React.FC = () => {
  const [customerId, setCustomerId] = useState<string|null>(null);
  
  // Debug enum values
  React.useEffect(() => {
    console.log('Environment enum:', Environment);
    console.log('Environment.SIT:', Environment.SIT);
    console.log('Environment.UAT:', Environment.UAT);
    console.log('Environment.PROD:', Environment.PROD);
    console.log('Currency enum:', Currency);
    console.log('Currency.OMR:', Currency.OMR);
    console.log('TransactionType enum:', TransactionType);
    console.log('TransactionType.NFC:', TransactionType.NFC);
    console.log('TransactionType.CARD_WALLET:', TransactionType.CARD_WALLET);
    console.log('TransactionType.APPLE_PAY:', TransactionType.APPLE_PAY);
  }, []);
  
  const [config, setConfig] = useState<Partial<AmwalPayConfig>>({
    environment: 'SIT' as Environment,
    currency: 'OMR' as Currency,
    transactionType: 'CARD_WALLET' as TransactionType,
    locale: 'en',
    merchantId: '84131',
    terminalId: '811018',
    amount: '1',
    secureHash:
      '8570CEED656C8818E4A7CE04F22206358F272DAD5F0227D322B654675ABF8F83',
    merchantReference: '1234',
     onCustomerId(customerId) {
      setCustomerId(customerId);
      console.log('Customer ID:', customerId);
    },
    onResponse(response) {
      console.log('Payment Response:', response);
    },
  });
  const [showEnvironmentPicker, setShowEnvironmentPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showTransactionTypePicker, setShowTransactionTypePicker] = useState(false);

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
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowEnvironmentPicker(true)}
        >
          <Text style={styles.pickerButtonText}>
            {config.environment || 'Select Environment'}
          </Text>
          <Text style={styles.pickerButtonArrow}>▼</Text>
        </TouchableOpacity>
        <ModalPicker
          visible={showEnvironmentPicker}
          selectedValue={config.environment}
          onValueChange={(value) => {
            setConfig({ ...config, environment: value as Environment });
            setShowEnvironmentPicker(false);
          }}
          onClose={() => setShowEnvironmentPicker(false)}
          items={[
            { label: 'SIT', value: 'SIT' },
            { label: 'UAT', value: 'UAT' },
            { label: 'PROD', value: 'PROD' },
          ]}
          title="Select Environment"
        />

        <Text style={styles.label}>Secure Hash</Text>
        <TextInput
          style={styles.input}
          value={config.secureHash}
          onChangeText={(value) => setConfig({ ...config, secureHash: value })}
          placeholder="Enter Secure Hash"
        />

        <Text style={styles.label}>Currency</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowCurrencyPicker(true)}
        >
          <Text style={styles.pickerButtonText}>
            {config.currency || 'Select Currency'}
          </Text>
          <Text style={styles.pickerButtonArrow}>▼</Text>
        </TouchableOpacity>
        <ModalPicker
          visible={showCurrencyPicker}
          selectedValue={config.currency}
          onValueChange={(value) => {
            setConfig({ ...config, currency: value as Currency });
            setShowCurrencyPicker(false);
          }}
          onClose={() => setShowCurrencyPicker(false)}
          items={[
            { label: 'OMR', value: 'OMR' },
          ]}
          title="Select Currency"
        />
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

        <Text style={styles.label}>Merchant Reference (Optional)</Text>
        <TextInput
          style={styles.input}
          value={config.merchantReference}
          onChangeText={(value) => setConfig({ ...config, merchantReference: value })}
          placeholder="Enter merchant reference"
        />

        <Text style={styles.label}>Transaction Type</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowTransactionTypePicker(true)}
        >
          <Text style={styles.pickerButtonText}>
            {config.transactionType || 'Select Transaction Type'}
          </Text>
          <Text style={styles.pickerButtonArrow}>▼</Text>
        </TouchableOpacity>
        <ModalPicker
          visible={showTransactionTypePicker}
          selectedValue={config.transactionType}
          onValueChange={(value) => {
            setConfig({
              ...config,
              transactionType: value as TransactionType,
            });
            setShowTransactionTypePicker(false);
          }}
          onClose={() => setShowTransactionTypePicker(false)}
          items={[
            { label: 'NFC', value: 'NFC' },
            { label: 'CARD_WALLET', value: 'CARD_WALLET' },
            { label: 'APPLE_PAY', value: 'APPLE_PAY' },
          ]}
          title="Select Transaction Type"
        />

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
    width: '100%',
    maxWidth: 300,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  pickerButtonArrow: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalPicker: {
    height: Platform.OS === 'ios' ? 200 : 150,
  },
  modalPickerItem: {
    fontSize: 16,
  },
  modalList: {
    maxHeight: 300,
  },
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalListItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  modalListItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalListItemTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalListItemCheck: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
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
