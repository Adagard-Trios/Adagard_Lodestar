import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';

export default function DriverApp() {
  const [trip, setTrip] = useState<any>(null);

  useEffect(() => {
    // Assuming DRV001 for demo purposes
    fetch('http://localhost:8080/trips/driver/USR_DRV_01?runDate=2026-04-07')
      .then(res => res.json())
      .then(data => setTrip(data))
      .catch(console.error);
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Driver Run (DR)</Text>
      </View>
      
      {trip ? (
        <View style={styles.content}>
          <Text style={styles.label}>Active Trip</Text>
          <View style={styles.card}>
            <Text style={styles.value}>{trip.brand} • {trip.district}</Text>
            <Text style={styles.subvalue}>Load: {trip.loadPct}% • {trip.totalKg}kg</Text>
          </View>
          
          <Text style={styles.label}>Stops</Text>
          {trip.stops?.map((stop: any, idx: number) => (
            <View key={stop.id} style={styles.card}>
              <Text style={styles.value}>{idx + 1}. {stop.outlet.name}</Text>
              <Text style={styles.subvalue}>Status: {stop.status}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.loadingText}>Fetching run manifest...</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1020', // Driver night mode surface
  },
  header: {
    padding: 24,
    paddingTop: 64,
    backgroundColor: '#141B2E',
    borderBottomWidth: 1,
    borderBottomColor: '#28314A',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F2F4FA',
  },
  content: {
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B5BDD1',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#141B2E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#28314A',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F2F4FA',
    marginBottom: 4,
  },
  subvalue: {
    fontSize: 14,
    color: '#7F89A3',
  },
  loadingText: {
    color: '#B5BDD1',
    textAlign: 'center',
    marginTop: 48,
  }
});
