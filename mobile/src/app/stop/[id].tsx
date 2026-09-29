import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import * as Speech from 'expo-speech';

export default function StopDetail() {
  const { id } = useLocalSearchParams();
  const [stop, setStop] = useState<any>(null);

  useEffect(() => {
    // Demo fetch
    fetch(`http://localhost:8080/trips`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0 && data[0].stops.length > 0) {
          setStop(data[0].stops[0]); // Just picking the first stop for demo
        }
      })
      .catch(console.error);
  }, [id]);

  const readAloud = () => {
    if (!stop) return;
    const etaText = stop.etaModel ? new Date(stop.etaModel).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '6:35 AM';
    const textToRead = `Stop ${stop.outlet.name}. District ${stop.outlet.district}. Brand ${stop.outlet.brand}. Model ETA is ${etaText}. Access notes: ${stop.outlet.accessNote || 'No specific access notes provided. Regular dock delivery.'}`;
    Speech.speak(textToRead, { language: 'en', rate: 0.9 });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back to Run</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stop Detail</Text>
      </View>
      
      {stop ? (
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>{stop.outlet.name}</Text>
            <Text style={styles.address}>{stop.outlet.district} • {stop.outlet.brand}</Text>
            
            <View style={styles.etaBox}>
              <Text style={styles.etaLabel}>ETA (Model)</Text>
              <Text style={styles.etaValue}>
                {stop.etaModel ? new Date(stop.etaModel).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '6:35 AM'}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Access Notes</Text>
            <Text style={styles.text}>{stop.outlet.accessNote || 'No specific access notes provided. Regular dock delivery.'}</Text>
          </View>

          <TouchableOpacity style={styles.voiceButton} onPress={readAloud}>
            <Text style={styles.voiceButtonText}>🔊 Read Aloud</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push(`/stop/${id}/pod`)}
          >
            <Text style={styles.primaryButtonText}>Capture POD</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.loadingText}>Loading stop details...</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1020' }, // Driver dark mode
  header: { padding: 24, paddingTop: 64, backgroundColor: '#141B2E', borderBottomWidth: 1, borderBottomColor: '#28314A' },
  backButton: { color: '#F5B83D', fontSize: 16, marginBottom: 12, fontWeight: 'bold' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#F2F4FA' },
  content: { padding: 24 },
  card: { backgroundColor: '#141B2E', padding: 20, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#28314A' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#F2F4FA', marginBottom: 4 },
  address: { fontSize: 16, color: '#B5BDD1', marginBottom: 20 },
  etaBox: { backgroundColor: '#1D2640', padding: 16, borderRadius: 8, alignItems: 'center' },
  etaLabel: { color: '#7F89A3', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  etaValue: { color: '#F5B83D', fontSize: 32, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#F2F4FA', marginBottom: 12 },
  text: { fontSize: 16, color: '#B5BDD1', lineHeight: 24 },
  voiceButton: { backgroundColor: '#1D2640', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#3B4666' },
  voiceButtonText: { color: '#F2F4FA', fontSize: 16, fontWeight: 'bold' },
  primaryButton: { backgroundColor: '#F5B83D', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  primaryButtonText: { color: '#111522', fontSize: 18, fontWeight: 'bold' },
  loadingText: { color: '#B5BDD1', textAlign: 'center', marginTop: 48, fontSize: 16 }
});
