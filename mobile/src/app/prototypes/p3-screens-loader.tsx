
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { p3_screens_loader } from '../../constants/prototypes';

export default function PrototypeView() {
  return (
    <View style={styles.container}>
      <WebView 
        originWhitelist={['*']}
        source={{ html: p3_screens_loader }}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 }
});
