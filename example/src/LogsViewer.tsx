import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LogsManager, LogType, type LogEntry } from './LogsManager';

const TYPE_COLORS: Record<LogType, string> = {
  [LogType.INFO]: '#007AFF',
  [LogType.ERROR]: '#FF3B30',
  [LogType.RESPONSE]: '#34C759',
  [LogType.CUSTOMER_ID]: '#FF9500',
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

const LogsViewer: React.FC<Props> = ({ visible, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>(() => LogsManager.getLogs());

  useEffect(() => {
    return LogsManager.subscribe(() => setLogs(LogsManager.getLogs()));
  }, []);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>SDK Logs</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => LogsManager.clearLogs()}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView
          style={styles.logsList}
          contentContainerStyle={styles.logsContent}
        >
          {logs.length === 0 ? (
            <Text style={styles.emptyText}>No logs yet</Text>
          ) : (
            logs.map((log) => (
              <View key={log.id} style={styles.logEntry}>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: TYPE_COLORS[log.type] },
                  ]}
                >
                  <Text style={styles.typeBadgeText}>{log.type}</Text>
                </View>
                <View style={styles.logBody}>
                  <Text style={styles.logMessage}>{log.message}</Text>
                  <Text style={styles.logTimestamp}>
                    {log.timestamp.toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  clearButton: { paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  clearButtonText: { fontSize: 15, color: '#FF3B30' },
  closeButton: { paddingHorizontal: 12, paddingVertical: 6 },
  closeButtonText: { fontSize: 15, color: '#007AFF', fontWeight: '600' },
  logsList: { flex: 1 },
  logsContent: { padding: 12 },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 16,
  },
  logEntry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  typeBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 10,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  typeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  logBody: { flex: 1 },
  logMessage: { fontSize: 13, color: '#333', lineHeight: 18 },
  logTimestamp: { fontSize: 11, color: '#999', marginTop: 4 },
});

export default LogsViewer;
