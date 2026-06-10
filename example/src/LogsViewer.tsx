import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  SafeAreaView,
  Clipboard,
  Alert,
} from 'react-native';
import { LogsManager, LogType } from './LogsManager';
import type { LogEntry } from './LogsManager';

interface LogsViewerProps {
  visible: boolean;
  onClose: () => void;
}

const LogsViewer: React.FC<LogsViewerProps> = ({ visible, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  useEffect(() => {
    const unsubscribe = LogsManager.subscribe(setLogs);
    setLogs(LogsManager.getLogs());
    return unsubscribe;
  }, []);

  const getLogIcon = (type: LogType): string => {
    switch (type) {
      case LogType.RESPONSE:
        return '✅';
      case LogType.CANCELLED:
        return '❌';
      case LogType.CUSTOMER_ID:
        return '👤';
      case LogType.ERROR:
        return '⚠️';
      case LogType.INFO:
        return 'ℹ️';
      case LogType.DEBUG:
        return '🐛';
      default:
        return '📝';
    }
  };

  const getLogColor = (type: LogType): string => {
    switch (type) {
      case LogType.RESPONSE:
        return '#4CAF50';
      case LogType.CANCELLED:
        return '#FF9800';
      case LogType.CUSTOMER_ID:
        return '#2196F3';
      case LogType.ERROR:
        return '#F44336';
      case LogType.INFO:
        return '#2196F3';
      case LogType.DEBUG:
        return '#9E9E9E';
      default:
        return '#000000';
    }
  };

  const getLogDisplayName = (type: LogType): string => {
    switch (type) {
      case LogType.RESPONSE:
        return 'Response';
      case LogType.CANCELLED:
        return 'Cancelled';
      case LogType.CUSTOMER_ID:
        return 'Customer ID';
      case LogType.ERROR:
        return 'Error';
      case LogType.INFO:
        return 'Info';
      case LogType.DEBUG:
        return 'Debug';
      default:
        return 'Log';
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString();
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', 'Log entry copied to clipboard');
  };

  const renderLogEntry = (log: LogEntry) => (
    <TouchableOpacity
      key={log.id}
      style={styles.logEntry}
      onPress={() => setSelectedLog(log)}
    >
      <View style={styles.logHeader}>
        <View style={styles.logTypeContainer}>
          <Text style={styles.logIcon}>{getLogIcon(log.type)}</Text>
          <Text style={[styles.logType, { color: getLogColor(log.type) }]}>
            {getLogDisplayName(log.type)}
          </Text>
        </View>
        <Text style={styles.timestamp}>{formatTimestamp(log.timestamp)}</Text>
      </View>
      <Text style={styles.logMessage} numberOfLines={2}>
        {log.message.length > 100
          ? `${log.message.substring(0, 100)}...`
          : log.message}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>🐛</Text>
            <Text style={styles.headerTitle}>SDK Logs</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => LogsManager.clearLogs()}
            >
              <Text style={styles.headerButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <Text style={styles.headerButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logs List */}
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>ℹ️</Text>
            <Text style={styles.emptyTitle}>No logs yet</Text>
            <Text style={styles.emptySubtitle}>
              SDK interactions will appear here
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.logsList}
            contentContainerStyle={styles.logsContent}
          >
            {logs.map(renderLogEntry)}
          </ScrollView>
        )}

        {/* Log Details Modal */}
        {selectedLog && (
          <Modal
            visible={!!selectedLog}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setSelectedLog(null)}
          >
            <SafeAreaView style={styles.detailsContainer}>
              <View style={styles.detailsHeader}>
                <View style={styles.detailsHeaderLeft}>
                  <Text style={styles.logIcon}>
                    {getLogIcon(selectedLog.type)}
                  </Text>
                  <Text
                    style={[
                      styles.detailsTitle,
                      { color: getLogColor(selectedLog.type) },
                    ]}
                  >
                    {getLogDisplayName(selectedLog.type)}
                  </Text>
                </View>
                <View style={styles.headerRight}>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => copyToClipboard(selectedLog.message)}
                  >
                    <Text style={styles.headerButtonText}>Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => setSelectedLog(null)}
                  >
                    <Text style={styles.headerButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView style={styles.detailsContent}>
                <Text style={styles.detailsTimestamp}>
                  Time: {formatTimestamp(selectedLog.timestamp)}
                </Text>
                <Text style={styles.detailsMessage} selectable>
                  {selectedLog.message}
                </Text>
              </ScrollView>
            </SafeAreaView>
          </Modal>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
  },
  logsList: {
    flex: 1,
  },
  logsContent: {
    padding: 8,
  },
  logEntry: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  logType: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  logMessage: {
    fontSize: 14,
    color: '#333',
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  detailsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailsContent: {
    flex: 1,
    padding: 16,
  },
  detailsTimestamp: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#666',
  },
  detailsMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
});

export default LogsViewer;
