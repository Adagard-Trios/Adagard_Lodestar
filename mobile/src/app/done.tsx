import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function RunComplete() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successIcon}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
        <Text style={styles.title}>Run Complete</Text>
        <Text style={styles.subtitle}>All 3 stops delivered successfully.</Text>
        
        <View style={styles.syncBox}>
          <Text style={styles.syncText}>SYNCED • 8:40 AM</Text>
          <Text style={styles.syncDetail}>7 records pushed to Lodestar HQ</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/')}>
          <Text style={styles.primaryButtonText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1020', justifyContent: 'center' },
  content: { padding: 24, alignItems: 'center' },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0F3326', borderWidth: 2, borderColor: '#5EE0A8', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  checkMark: { color: '#5EE0A8', fontSize: 40, fontWeight: 'bold' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#F2F4FA', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#B5BDD1', marginBottom: 48 },
  syncBox: { backgroundColor: '#141B2E', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#28314A', width: '100%', alignItems: 'center', marginBottom: 32 },
  syncText: { color: '#5EE0A8', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  syncDetail: { color: '#7F89A3', fontSize: 14 },
  primaryButton: { backgroundColor: '#F5B83D', padding: 20, borderRadius: 12, alignItems: 'center', width: '100%' },
  primaryButtonText: { color: '#111522', fontSize: 18, fontWeight: 'bold' }
});
