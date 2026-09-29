
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { p1_screens_store } from '../../constants/prototypes';

export default function PrototypeView() {
  return (
    <View style={styles.container}>
      <WebView 
        originWhitelist={['*']}
        source={{ html: p1_screens_store }}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 }
});
