import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';

export default function LoadManifest() {
  const { id } = useLocalSearchParams();
  const [trip, setTrip] = useState<any>(null);

  useEffect(() => {
    // Demo fetch
    fetch(`http://localhost:8080/trips/${id}`)
      .then(res => res.json())
      .then(setTrip)
      .catch(console.error);
  }, [id]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back to Bay Queue</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Load Manifest</Text>
      </View>
      
      {trip ? (
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{trip.vehicle?.id}</Text>
              <Text style={styles.bayBadge}>Bay {trip.bay}</Text>
            </View>
            <Text style={styles.subtitle}>{trip.brand} • {trip.totalKg}kg Total</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Manifest Lines</Text>
            
            {/* Hardcoded mock data based on the scenario shortfalls */}
            <View style={styles.lineItem}>
              <View style={styles.lineInfo}>
                <Text style={styles.itemName}>Yoghurt (Mixed Fruit)</Text>
                <Text style={styles.itemMeta}>Temp: CHILLED • ORD0104217</Text>
              </View>
              <View style={styles.qtyBoxWarn}>
                <Text style={styles.qtyTextWarn}>4/6</Text>
                <Text style={styles.qtyLabelWarn}>SHORT</Text>
              </View>
            </View>

            <View style={styles.lineItem}>
              <View style={styles.lineInfo}>
                <Text style={styles.itemName}>Chicken Trays</Text>
                <Text style={styles.itemMeta}>Temp: CHILLED • ORD0104216</Text>
              </View>
              <View style={styles.qtyBox}>
                <Text style={styles.qtyText}>12/12</Text>
                <Text style={styles.qtyLabel}>OK</Text>
              </View>
            </View>

          </View>

          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => alert('Release process started')}
          >
            <Text style={styles.primaryButtonText}>Release Vehicle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.loadingText}>Loading manifest...</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' }, // Loader light mode
  header: { padding: 24, paddingTop: 64, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#D8DDE6' },
  backButton: { color: '#141B4D', fontSize: 16, marginBottom: 12, fontWeight: 'bold' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0A0F1A' },
  content: { padding: 24 },
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#D8DDE6' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0A0F1A' },
  bayBadge: { backgroundColor: '#141B4D', color: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, fontWeight: 'bold', fontSize: 16 },
  subtitle: { fontSize: 16, color: '#4A5467' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0A0F1A', marginBottom: 16 },
  lineItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E9ECF2' },
  lineInfo: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#0A0F1A', marginBottom: 4 },
  itemMeta: { fontSize: 14, color: '#4A5467' },
  qtyBox: { backgroundColor: '#E8F8F0', padding: 12, borderRadius: 8, alignItems: 'center', minWidth: 80 },
  qtyText: { fontSize: 20, fontWeight: 'bold', color: '#047857' },
  qtyLabel: { fontSize: 12, fontWeight: 'bold', color: '#047857', marginTop: 2 },
  qtyBoxWarn: { backgroundColor: '#FFF6E5', padding: 12, borderRadius: 8, alignItems: 'center', minWidth: 80, borderWidth: 1, borderColor: '#F6D08A' },
  qtyTextWarn: { fontSize: 20, fontWeight: 'bold', color: '#B45309' },
  qtyLabelWarn: { fontSize: 12, fontWeight: 'bold', color: '#B45309', marginTop: 2 },
  primaryButton: { backgroundColor: '#141B4D', padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  loadingText: { color: '#4A5467', textAlign: 'center', marginTop: 48, fontSize: 18 }
});
