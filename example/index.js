import { AppRegistry } from 'react-native';
import { installQCLogging } from './src/QCLogging';
import App from './src/App';
import { name as appName } from './app.json';

// Before anything else logs, so QC exports contain the whole session.
installQCLogging();

AppRegistry.registerComponent(appName, () => App);
