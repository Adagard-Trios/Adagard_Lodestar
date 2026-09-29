import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';

export default function Home() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Waypoint Lodestar</Text>
        
        <Text style={styles.sectionTitle}>Live Apps</Text>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#141B4D' }]} 
          onPress={() => router.push('/driver')}
        >
          <Text style={styles.buttonText}>Driver App (DR)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#344054' }]} 
          onPress={() => router.push('/loader')}
        >
          <Text style={styles.buttonText}>Loader App (LD)</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 40 }]}>Figma UI Prototypes (WebView)</Text>
        
        <TouchableOpacity style={styles.protoButton} onPress={() => router.push('/prototypes/p1-screens-store')}>
          <Text style={styles.protoText}>P1: Store Manager (42)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.protoButton} onPress={() => router.push('/prototypes/p2-screens-dispatcher')}>
          <Text style={styles.protoText}>P2: Dispatcher (40)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.protoButton} onPress={() => router.push('/prototypes/p3-screens-loader')}>
          <Text style={styles.protoText}>P3: Loader (32)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.protoButton} onPress={() => router.push('/prototypes/p4-screens-driver')}>
          <Text style={styles.protoText}>P4: Driver (42)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.protoButton} onPress={() => router.push('/prototypes/p5-screens-degradation')}>
          <Text style={styles.protoText}>P5: Degradation (11)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.protoButton} onPress={() => router.push('/prototypes/p6-screens-admin')}>
          <Text style={styles.protoText}>P6: Admin (20)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1422' },
  content: { padding: 24, paddingTop: 64 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 32, textAlign: 'center' },
  sectionTitle: { fontSize: 16, color: '#8F98AA', marginBottom: 16, fontWeight: 'bold', textTransform: 'uppercase' },
  button: { width: '100%', padding: 16, borderRadius: 12, marginBottom: 16, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  protoButton: { width: '100%', padding: 16, borderRadius: 8, marginBottom: 12, backgroundColor: '#1D2640', borderWidth: 1, borderColor: '#344054' },
  protoText: { color: '#DCE4F5', fontSize: 16, fontWeight: '600' },
});
