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
import {
  AmwalPaySDK,
  Environment,
  Currency,
  TransactionType,
  Logger,
  type AmwalPayConfig,
} from 'react-amwal-pay';
import LogsViewer from './LogsViewer';
import { LogsManager, LogType } from './LogsManager';

interface ModalPickerProps {
  visible: boolean;
  selectedValue: string | undefined;
  onValueChange: (value: string) => void;
  onClose: () => void;
  items: Array<{ label: string; value: string }>;
  title: string;
}

interface ColorPickerProps {
  visible: boolean;
  selectedColor: string | undefined;
  onColorChange: (color: string) => void;
  onClose: () => void;
  title: string;
}

const COLOR_SWATCHES = [
  // Blues
  '#1E88E5',
  '#2196F3',
  '#03A9F4',
  '#00BCD4',
  '#0D47A1',
  '#1565C0',
  // Greens
  '#4CAF50',
  '#8BC34A',
  '#CDDC39',
  '#009688',
  '#2E7D32',
  '#43A047',
  // Reds & Pinks
  '#F44336',
  '#E91E63',
  '#FF5722',
  '#C62828',
  '#D32F2F',
  '#E53935',
  // Oranges & Yellows
  '#FF9800',
  '#FFC107',
  '#FFEB3B',
  '#FF5722',
  '#EF6C00',
  '#F57C00',
  // Purples
  '#9C27B0',
  '#673AB7',
  '#3F51B5',
  '#7B1FA2',
  '#8E24AA',
  '#AB47BC',
  // Grays & Neutrals
  '#9E9E9E',
  '#607D8B',
  '#455A64',
  '#37474F',
  '#212121',
  '#000000',
];

const ColorPicker: React.FC<ColorPickerProps> = ({
  visible,
  selectedColor,
  onColorChange,
  onClose,
  title,
}) => {
  const [customHex, setCustomHex] = useState(selectedColor || '#1E88E5');

  React.useEffect(() => {
    if (selectedColor) {
      setCustomHex(selectedColor);
    }
  }, [selectedColor]);

  const isValidHex = (hex: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  };

  const handleCustomHexChange = (text: string) => {
    // Auto-add # if not present
    let formatted = text;
    if (text.length > 0 && !text.startsWith('#')) {
      formatted = '#' + text;
    }
    setCustomHex(formatted.toUpperCase());
  };

  const handleApplyCustomColor = () => {
    if (isValidHex(customHex)) {
      onColorChange(customHex);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={colorPickerStyles.modalOverlay}>
        <View style={colorPickerStyles.modalContent}>
          <View style={colorPickerStyles.modalHeader}>
            <Text style={colorPickerStyles.modalTitle}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={colorPickerStyles.modalCloseButton}
            >
              <Text style={colorPickerStyles.modalCloseButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Color Preview */}
          <View style={colorPickerStyles.previewContainer}>
            <View
              style={[
                colorPickerStyles.colorPreview,
                {
                  backgroundColor: isValidHex(customHex)
                    ? customHex
                    : '#CCCCCC',
                },
              ]}
            />
            <Text style={colorPickerStyles.previewText}>
              {isValidHex(customHex) ? customHex : 'Invalid color'}
            </Text>
          </View>

          {/* Custom Hex Input */}
          <View style={colorPickerStyles.customInputContainer}>
            <TextInput
              style={colorPickerStyles.hexInput}
              value={customHex}
              onChangeText={handleCustomHexChange}
              placeholder="#FFFFFF"
              maxLength={7}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[
                colorPickerStyles.applyButton,
                !isValidHex(customHex) && colorPickerStyles.applyButtonDisabled,
              ]}
              onPress={handleApplyCustomColor}
              disabled={!isValidHex(customHex)}
            >
              <Text style={colorPickerStyles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>

          {/* Color Swatches */}
          <ScrollView style={colorPickerStyles.swatchesContainer}>
            <View style={colorPickerStyles.swatchesGrid}>
              {COLOR_SWATCHES.map((color, index) => (
                <TouchableOpacity
                  key={`${color}-${index}`}
                  style={[
                    colorPickerStyles.colorSwatch,
                    { backgroundColor: color },
                    selectedColor === color && colorPickerStyles.selectedSwatch,
                  ]}
                  onPress={() => {
                    onColorChange(color);
                    onClose();
                  }}
                >
                  {selectedColor === color && (
                    <Text style={colorPickerStyles.checkMark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const colorPickerStyles = StyleSheet.create({
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
    maxHeight: '70%',
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
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  colorPreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  previewText: {
    marginLeft: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  hexInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 12,
  },
  applyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  applyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  swatchesContainer: {
    padding: 16,
  },
  swatchesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    margin: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSwatch: {
    borderColor: '#333',
    borderWidth: 3,
  },
  checkMark: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

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
                  selectedValue === item.value && styles.modalListItemSelected,
                ]}
                onPress={() => {
                  onValueChange(item.value);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.modalListItemText,
                    selectedValue === item.value &&
                      styles.modalListItemTextSelected,
                  ]}
                >
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
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [showLogsViewer, setShowLogsViewer] = useState(false);

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

    LogsManager.addLog('PaymentScreen initialized', LogType.INFO);

    // Initialize SDK Logger
    const logger = Logger.getInstance();
    logger.setDebugEnabled(true);
    logger.info('PaymentScreen', 'Component initialized with enhanced logging');
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
    additionValues: {
      useBottomSheetDesign: 'false',
      ignoreReceipt: 'false',
      primaryColor: '#1E88E5',
      secondaryColor: '#FFC107',
    },
  });

  // Define callbacks separately to avoid stale closure issues
  const handleCustomerId = React.useCallback((receivedCustomerId: string) => {
    setCustomerId(receivedCustomerId);
    console.log('Customer ID received:', receivedCustomerId);
    LogsManager.addLog(
      `Customer ID received: ${receivedCustomerId}`,
      LogType.CUSTOMER_ID
    );
  }, []);

  const handleResponse = React.useCallback((response: any) => {
    // Handle both Android (wrapped in "data") and iOS (direct) response formats
    const actualResponse = response?.data ? response.data : response;
    console.log('Payment Response received:', actualResponse);
    LogsManager.addLog(
      `Payment Response: ${JSON.stringify(actualResponse)}`,
      LogType.RESPONSE
    );
  }, []);
  const [showEnvironmentPicker, setShowEnvironmentPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showTransactionTypePicker, setShowTransactionTypePicker] =
    useState(false);
  const [showBottomSheetPicker, setShowBottomSheetPicker] = useState(false);
  const [showIgnoreReceiptPicker, setShowIgnoreReceiptPicker] = useState(false);
  const [showPrimaryColorPicker, setShowPrimaryColorPicker] = useState(false);
  const [showSecondaryColorPicker, setShowSecondaryColorPicker] =
    useState(false);

  const handleInitializePayment = async () => {
    try {
      LogsManager.addLog('Starting payment initialization', LogType.INFO);

      if (!isConfigValid()) {
        Alert.alert('Error', 'Please fill in all required fields');
        LogsManager.addLog(
          'Payment initialization failed: Invalid configuration',
          LogType.ERROR
        );
        return;
      }

      LogsManager.addLog(
        `Initializing payment with merchant: ${config.merchantId}`,
        LogType.INFO
      );

      const paymentConfig = {
        ...config,
        customerId,
        onCustomerId: handleCustomerId,
        onResponse: handleResponse,
      };
      const amwalPay = AmwalPaySDK.getInstance();
      await amwalPay.startPayment(paymentConfig as AmwalPayConfig);

      LogsManager.addLog('Payment SDK started successfully', LogType.INFO);
    } catch (e) {
      Alert.alert('Error', 'Error starting payment');
      console.log(e);
      LogsManager.addLog(`Payment initialization error: ${e}`, LogType.ERROR);
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
        <View style={styles.appBarButtons}>
          <TouchableOpacity
            style={styles.appBarButton}
            onPress={() => setShowLogsViewer(true)}
            accessibilityLabel="View SDK Logs"
          >
            <Text style={{ fontSize: 20, color: '#007AFF' }}>🐛</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.appBarButton}
            onPress={() => {
              const logger = Logger.getInstance();
              const sdkLogs = logger.exportLogs();
              console.log('SDK Logs:', sdkLogs);
              Alert.alert('SDK Logs', 'Check console for detailed logs');
            }}
            accessibilityLabel="Export SDK Logs"
          >
            <Text style={{ fontSize: 20, color: '#28a745' }}>📋</Text>
          </TouchableOpacity>
          <ClearCustomerIdButton onPress={() => setCustomerId(null)} />
        </View>
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
          items={[{ label: 'OMR', value: 'OMR' }]}
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
          onChangeText={(value) =>
            setConfig({ ...config, merchantReference: value })
          }
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

        <Text style={styles.label}>Primary Color</Text>
        <TouchableOpacity
          style={styles.colorPickerButton}
          onPress={() => setShowPrimaryColorPicker(true)}
        >
          <View
            style={[
              styles.colorSwatch,
              {
                backgroundColor:
                  config.additionValues?.primaryColor || '#1E88E5',
              },
            ]}
          />
          <Text style={styles.pickerButtonText}>
            {config.additionValues?.primaryColor || '#1E88E5'}
          </Text>
          <Text style={styles.pickerButtonArrow}>▼</Text>
        </TouchableOpacity>
        <ColorPicker
          visible={showPrimaryColorPicker}
          selectedColor={config.additionValues?.primaryColor}
          onColorChange={(color) => {
            setConfig({
              ...config,
              additionValues: {
                ...config.additionValues,
                primaryColor: color,
              },
            });
          }}
          onClose={() => setShowPrimaryColorPicker(false)}
          title="Select Primary Color"
        />

        <Text style={styles.label}>Secondary Color</Text>
        <TouchableOpacity
          style={styles.colorPickerButton}
          onPress={() => setShowSecondaryColorPicker(true)}
        >
          <View
            style={[
              styles.colorSwatch,
              {
                backgroundColor:
                  config.additionValues?.secondaryColor || '#FFC107',
              },
            ]}
          />
          <Text style={styles.pickerButtonText}>
            {config.additionValues?.secondaryColor || '#FFC107'}
          </Text>
          <Text style={styles.pickerButtonArrow}>▼</Text>
        </TouchableOpacity>
        <ColorPicker
          visible={showSecondaryColorPicker}
          selectedColor={config.additionValues?.secondaryColor}
          onColorChange={(color) => {
            setConfig({
              ...config,
              additionValues: {
                ...config.additionValues,
                secondaryColor: color,
              },
            });
          }}
          onClose={() => setShowSecondaryColorPicker(false)}
          title="Select Secondary Color"
        />

        <Text style={styles.label}>Ignore Receipt Screen</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowIgnoreReceiptPicker(true)}
        >
          <Text style={styles.pickerButtonText}>
            {config.additionValues?.ignoreReceipt === 'true' ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.pickerButtonArrow}>▼</Text>
        </TouchableOpacity>
        <ModalPicker
          visible={showIgnoreReceiptPicker}
          selectedValue={config.additionValues?.ignoreReceipt}
          onValueChange={(value) => {
            setConfig({
              ...config,
              additionValues: {
                ...config.additionValues,
                ignoreReceipt: value,
              },
            });
            setShowIgnoreReceiptPicker(false);
          }}
          onClose={() => setShowIgnoreReceiptPicker(false)}
          items={[
            { label: 'No ', value: 'false' },
            { label: 'Yes', value: 'true' },
          ]}
          title="Ignore Receipt Screen"
        />
        <Text style={styles.label}>Use Bottom Sheet Design</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowBottomSheetPicker(true)}
        >
          <Text style={styles.pickerButtonText}>
            {config.additionValues?.useBottomSheetDesign === 'true'
              ? 'Yes'
              : 'No'}
          </Text>
          <Text style={styles.pickerButtonArrow}>▼</Text>
        </TouchableOpacity>
        <ModalPicker
          visible={showBottomSheetPicker}
          selectedValue={config.additionValues?.useBottomSheetDesign}
          onValueChange={(value) => {
            setConfig({
              ...config,
              additionValues: {
                ...config.additionValues,
                useBottomSheetDesign: value,
              },
            });
            setShowBottomSheetPicker(false);
          }}
          onClose={() => setShowBottomSheetPicker(false)}
          items={[
            { label: 'No', value: 'false' },
            { label: 'Yes', value: 'true' },
          ]}
          title="Use Bottom Sheet Design"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleInitializePayment}
        >
          <Text style={styles.buttonText}>Start Payment</Text>
        </TouchableOpacity>
      </ScrollView>

      <LogsViewer
        visible={showLogsViewer}
        onClose={() => setShowLogsViewer(false)}
      />
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
  appBarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appBarButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 8,
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
  colorPickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ddd',
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
  sectionDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
});

// Add this component before the styles
// Update ClearCustomerIdButton to accept onPress
const ClearCustomerIdButton = ({ onPress }: { onPress?: () => void }) => (
  <TouchableOpacity
    style={styles.appBarButton}
    onPress={async () => {
      Alert.alert('Customer ID cleared');
      LogsManager.addLog('Customer ID cleared', LogType.INFO);
      if (onPress) onPress();
    }}
    accessibilityLabel="Clear Customer ID"
  >
    <Text style={{ fontSize: 20, color: '#e74c3c' }}>🗑️</Text>
  </TouchableOpacity>
);
