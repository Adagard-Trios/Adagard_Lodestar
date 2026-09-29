import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';

export default function LoaderRelease() {
  const [seal, setSeal] = useState('KDY-57-10413');
  const [temp, setTemp] = useState('3.0');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back to Manifest</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Release Vehicle (LD-04)</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Seal Number</Text>
          <TextInput style={styles.input} value={seal} onChangeText={setSeal} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Reefer Temp (°C)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={temp} onChangeText={setTemp} />
          {parseFloat(temp) > 4.0 && (
            <Text style={styles.warningText}>⚠️ Temp is above 4°C. Cannot release chilled load.</Text>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.primaryButton, parseFloat(temp) > 4.0 && styles.disabledButton]} 
          disabled={parseFloat(temp) > 4.0}
          onPress={() => {
            alert('Vehicle Released Successfully!');
            router.push('/loader');
          }}
        >
          <Text style={styles.primaryButtonText}>Sign Off & Release</Text>
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
  content: { padding: 24 },
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#D8DDE6' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#4A5467', textTransform: 'uppercase', marginBottom: 12 },
  input: { backgroundColor: '#F4F6F9', color: '#0A0F1A', fontSize: 20, fontWeight: 'bold', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#D8DDE6' },
  warningText: { color: '#B42318', marginTop: 12, fontWeight: 'bold', fontSize: 14 },
  primaryButton: { backgroundColor: '#141B4D', padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  disabledButton: { backgroundColor: '#8F98AA' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }
});
