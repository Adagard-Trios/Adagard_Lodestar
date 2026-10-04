// Debug-only trust for the local stack's self-signed gateway certificate (https://localhost:8443 via `adb reverse`).
//   Release (src/main):  res/xml/network_security_config.xml = HTTPS only, system CAs only.
//   Debug (src/debug overrides the same resource): also trusts the bundled dev cert (res/raw, debug source set
//   only) and allows cleartext to localhost so the debug app can load JS from Metro (:8081).
// The cert file is not committed: pull it from the running gateway with
//   docker exec lodestar-gateway-1 cat /tmp/gateway-certs/tls.crt > .dev-certs/gateway.crt
// (or point LODESTAR_DEV_CERT at it). Without the file the plugin does nothing.
const fs = require('fs');
const path = require('path');
const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');

const RAW_NAME = 'dev_gateway_cert';

const RELEASE_XML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors><certificates src="system" /></trust-anchors>
  </base-config>
</network-security-config>
`;

const DEBUG_XML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system" />
      <certificates src="@raw/${RAW_NAME}" />
    </trust-anchors>
  </base-config>
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="false">localhost</domain>
    <domain includeSubdomains="false">127.0.0.1</domain>
    <domain includeSubdomains="false">10.0.2.2</domain>
  </domain-config>
</network-security-config>
`;

function certPath(projectRoot) {
  return process.env.LODESTAR_DEV_CERT || path.join(projectRoot, '.dev-certs', 'gateway.crt');
}

module.exports = function withDevGatewayCert(config) {
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const src = certPath(cfg.modRequest.projectRoot);
      if (!fs.existsSync(src)) return cfg;
      const appSrc = path.join(cfg.modRequest.platformProjectRoot, 'app', 'src');
      const out = (set, file) => {
        const p = path.join(appSrc, set, 'res', file);
        fs.mkdirSync(path.dirname(p), { recursive: true });
        return p;
      };
      fs.writeFileSync(out('main', 'xml/network_security_config.xml'), RELEASE_XML);
      fs.writeFileSync(out('debug', 'xml/network_security_config.xml'), DEBUG_XML);
      fs.copyFileSync(src, out('debug', `raw/${RAW_NAME}.crt`));
      return cfg;
    },
  ]);
  return withAndroidManifest(config, (cfg) => {
    if (!fs.existsSync(certPath(cfg.modRequest.projectRoot))) return cfg;
    const app = cfg.modResults.manifest.application?.[0];
    if (app) app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    return cfg;
  });
};
