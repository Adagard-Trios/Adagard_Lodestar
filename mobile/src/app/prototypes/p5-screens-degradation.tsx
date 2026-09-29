
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { p5_screens_degradation } from '../../constants/prototypes';

export default function PrototypeView() {
  return (
    <View style={styles.container}>
      <WebView 
        originWhitelist={['*']}
        source={{ html: p5_screens_degradation }}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 }
});
