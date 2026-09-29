import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';

export default function LoaderApp() {
  const [queue, setQueue] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:8080/trips/bay-queue?depot=PELIYAGODA&runDate=2026-04-07')
      .then(res => res.json())
      .then(data => setQueue(data))
      .catch(console.error);
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bay Queue (LD)</Text>
      </View>
      
      <View style={styles.content}>
        {queue.length > 0 ? queue.map((trip: any) => (
          <View key={trip.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.value}>{trip.brand} • {trip.district}</Text>
              <Text style={styles.bayBadge}>Bay {trip.bay}</Text>
            </View>
            <Text style={styles.subvalue}>Vehicle: {trip.vehicle?.id}</Text>
            <Text style={styles.subvalue}>Driver: {trip.driver?.name || 'Unassigned'}</Text>
          </View>
        )) : (
          <Text style={styles.loadingText}>Loading bay queue...</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9', // Loader light mode
  },
  header: {
    padding: 24,
    paddingTop: 64,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#D8DDE6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A0F1A',
  },
  content: {
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D8DDE6',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0A0F1A',
  },
  bayBadge: {
    backgroundColor: '#141B4D',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
  subvalue: {
    fontSize: 16,
    color: '#4A5467',
    marginBottom: 4,
  },
  loadingText: {
    color: '#4A5467',
    textAlign: 'center',
    marginTop: 48,
    fontSize: 18,
  }
});
