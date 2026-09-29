import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function LoaderScan() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Barcode (LD-03)</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.cameraBox}>
          <Text style={styles.cameraText}>[ CAMERA VIEW PORT ]</Text>
          <Text style={styles.cameraSubtext}>Align barcode within frame</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => alert('Barcode Scanned Successfully!')}>
          <Text style={styles.primaryButtonText}>Manual Override</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  header: { padding: 24, paddingTop: 64, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#D8DDE6' },
  backButton: { color: '#141B4D', fontSize: 16, marginBottom: 12, fontWeight: 'bold' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0A0F1A' },
  content: { padding: 24, flex: 1, justifyContent: 'center' },
  cameraBox: { height: 300, backgroundColor: '#101828', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  cameraText: { color: '#F5B83D', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  cameraSubtext: { color: '#8F98AA', fontSize: 16 },
  primaryButton: { backgroundColor: '#141B4D', padding: 20, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }
});
