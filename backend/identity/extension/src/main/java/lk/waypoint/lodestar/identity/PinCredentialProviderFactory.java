package lk.waypoint.lodestar.identity;

import org.keycloak.credential.CredentialProviderFactory;
import org.keycloak.models.KeycloakSession;

public class PinCredentialProviderFactory implements CredentialProviderFactory<PinCredentialProvider> {
    @Override
    public String getId() {
        return PinCredentialProvider.TYPE;
    }

    @Override
    public PinCredentialProvider create(KeycloakSession session) {
        return new PinCredentialProvider(session);
    }
}
