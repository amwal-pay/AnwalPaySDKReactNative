import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { PaymentScreen } from './src/screens/PaymentScreen';

function App(): React.ReactElement {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <PaymentScreen />
    </SafeAreaView>
  );
}

export default App;
