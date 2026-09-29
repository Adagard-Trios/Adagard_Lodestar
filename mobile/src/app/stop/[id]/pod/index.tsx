import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function ProofOfDelivery() {
  const { id } = useLocalSearchParams();
  const [units, setUnits] = useState('0');
  const [signature, setSignature] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);

  const submitPOD = () => {
    // In a real app, this would use SQLite if offline, or API if online
    Alert.alert(
      "POD Saved",
      "Delivery confirmed and saved to offline queue.",
      [{ text: "Back to Run", onPress: () => router.push('/driver') }]
    );
  };

  const handleScan = () => {
    if (!permission?.granted) {
      requestPermission();
      return;
    }
    setIsScanning(true);
    // Simulate computer vision processing time
    setTimeout(() => {
      setIsScanning(false);
      setUnits('58'); // Simulated computer vision auto-fill for ORD0104216 58 units
      Alert.alert('Scan Complete', 'Computer vision detected 58 units.');
    }, 1500);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Proof of Delivery</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Units Delivered</Text>
          <TextInput 
            style={styles.input}
            keyboardType="number-pad"
            value={units}
            onChangeText={setUnits}
          />
          <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
            <Text style={styles.scanButtonText}>{isScanning ? 'Scanning...' : '📷 Scan Delivery Stub (Auto-Fill)'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Receiver Name / Signature</Text>
          <TextInput 
            style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
            multiline
            placeholder="Sign here..."
            placeholderTextColor="#4A5467"
            value={signature}
            onChangeText={setSignature}
          />
        </View>
        
        <View style={styles.alertBox}>
          <Text style={styles.alertText}>
            You are currently offline (Dead Zone). This POD will be saved to your device and synced automatically when signal returns.
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={submitPOD}>
          <Text style={styles.primaryButtonText}>Save POD</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1020' }, 
  header: { padding: 24, paddingTop: 64, backgroundColor: '#141B2E', borderBottomWidth: 1, borderBottomColor: '#28314A' },
  backButton: { color: '#F5B83D', fontSize: 16, marginBottom: 12, fontWeight: 'bold' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#F2F4FA' },
  content: { padding: 24 },
  card: { backgroundColor: '#141B2E', padding: 20, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#28314A' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#B5BDD1', textTransform: 'uppercase', marginBottom: 12 },
  input: { backgroundColor: '#1D2640', color: '#F2F4FA', fontSize: 20, fontWeight: 'bold', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#3B4666' },
  scanButton: { backgroundColor: '#1D2640', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#3B4666' },
  scanButtonText: { color: '#F5B83D', fontSize: 14, fontWeight: 'bold' },
  alertBox: { backgroundColor: '#2A2724', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#57534E', marginBottom: 24 },
  alertText: { color: '#D6CFC7', fontSize: 14, lineHeight: 20 },
  primaryButton: { backgroundColor: '#F5B83D', padding: 18, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#111522', fontSize: 18, fontWeight: 'bold' }
});
