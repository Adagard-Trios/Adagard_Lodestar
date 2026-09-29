const fs = require('fs');
const path = require('path');

const designingDir = path.join(__dirname, 'Designing');
const pagesDir = path.join(designingDir, 'pages');
const assetsDir = path.join(designingDir, 'assets');

// 1. Copy assets to frontend/public/assets
const nextAssetsDir = path.join(__dirname, 'frontend', 'public', 'assets');
if (!fs.existsSync(nextAssetsDir)) fs.mkdirSync(nextAssetsDir, { recursive: true });

fs.readdirSync(assetsDir).forEach(file => {
  fs.copyFileSync(path.join(assetsDir, file), path.join(nextAssetsDir, file));
});

// 2. Generate Next.js Pages
const nextAppDir = path.join(__dirname, 'frontend', 'app', 'prototypes');
if (!fs.existsSync(nextAppDir)) fs.mkdirSync(nextAppDir, { recursive: true });

const htmlFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html') && f.startsWith('P'));

htmlFiles.forEach(file => {
  const routeName = file.replace('.html', '').toLowerCase();
  const routeDir = path.join(nextAppDir, routeName);
  if (!fs.existsSync(routeDir)) fs.mkdirSync(routeDir, { recursive: true });
  
  let htmlContent = fs.readFileSync(path.join(pagesDir, file), 'utf8');
  // Fix asset paths
  htmlContent = htmlContent.replace(/\.\.\/assets\//g, '/assets/');
  // Escape for backticks
  htmlContent = htmlContent.replace(/`/g, '\\`').replace(/\$/g, '\\$');

  const tsxContent = `
import React from 'react';

export default function ${routeName.replace(/-/g, '')}() {
  return (
    <div dangerouslySetInnerHTML={{ __html: \`${htmlContent}\` }} />
  );
}
`;
  fs.writeFileSync(path.join(routeDir, 'page.tsx'), tsxContent);
});

// 3. Generate React Native WebView Strings
const mobileConstantsDir = path.join(__dirname, 'mobile', 'src', 'constants');
if (!fs.existsSync(mobileConstantsDir)) fs.mkdirSync(mobileConstantsDir, { recursive: true });

let tsContent = `// Auto-generated prototype HTML strings for WebView\n\n`;

// Also need the CSS content to inject into the mobile HTML
const tokensCss = fs.readFileSync(path.join(assetsDir, 'tokens.css'), 'utf8');
const baseCss = fs.readFileSync(path.join(assetsDir, 'base.css'), 'utf8');
const componentsCss = fs.readFileSync(path.join(assetsDir, 'components.css'), 'utf8');
const injectedStyles = `<style>${tokensCss}\n${baseCss}\n${componentsCss}</style>`;

htmlFiles.forEach(file => {
  const routeName = file.replace('.html', '').replace(/-/g, '_').toLowerCase();
  let htmlContent = fs.readFileSync(path.join(pagesDir, file), 'utf8');
  
  // Replace the link tags with the actual CSS for mobile since it can't load local files easily in webview
  htmlContent = htmlContent.replace(/<link rel="stylesheet" href="\.\.\/assets\/.*\.css">/g, '');
  htmlContent = htmlContent.replace('</head>', `${injectedStyles}</head>`);
  
  htmlContent = htmlContent.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  
  tsContent += `export const ${routeName} = \`${htmlContent}\`;\n\n`;
});

fs.writeFileSync(path.join(mobileConstantsDir, 'prototypes.ts'), tsContent);

// 4. Generate Mobile Routes
const mobileAppDir = path.join(__dirname, 'mobile', 'src', 'app', 'prototypes');
if (!fs.existsSync(mobileAppDir)) fs.mkdirSync(mobileAppDir, { recursive: true });

htmlFiles.forEach(file => {
  const name = file.replace('.html', '').toLowerCase();
  const constName = name.replace(/-/g, '_');
  
  const tsxContent = `
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { ${constName} } from '../../constants/prototypes';

export default function PrototypeView() {
  return (
    <View style={styles.container}>
      <WebView 
        originWhitelist={['*']}
        source={{ html: ${constName} }}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 }
});
`;
  fs.writeFileSync(path.join(mobileAppDir, `${name}.tsx`), tsxContent);
});

console.log("Prototypes successfully ingested into Next.js and Expo apps!");
