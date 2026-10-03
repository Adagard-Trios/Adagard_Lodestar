package lk.waypoint.lodestar.identity;

import java.util.Map;
import org.keycloak.common.util.Time;
import org.keycloak.credential.CredentialInput;
import org.keycloak.credential.CredentialInputValidator;
import org.keycloak.credential.CredentialModel;
import org.keycloak.credential.CredentialProvider;
import org.keycloak.credential.CredentialTypeMetadata;
import org.keycloak.credential.CredentialTypeMetadataContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.util.JsonSerialization;

/**
 * The Dock PIN (LD-06 "PIN · 4 digits") as its own Keycloak credential, separate from the password: a loader's
 * password still follows the realm's password policy (12+ characters), the PIN is 4 to 8 digits and only opens a
 * session through the Lodestar direct-grant flow. Stored as PBKDF2-SHA256 with a per-PIN salt; failed PINs count
 * towards the realm's brute-force lockout like failed passwords.
 */
public class PinCredentialProvider implements CredentialProvider<CredentialModel>, CredentialInputValidator {
    public static final String TYPE = "lodestar-pin";

    private final KeycloakSession session;

    public PinCredentialProvider(KeycloakSession session) {
        this.session = session;
    }

    @Override
    public String getType() {
        return TYPE;
    }

    /** Replaces the user's PIN with `pin` (4 to 8 digits). */
    public CredentialModel setPin(RealmModel realm, UserModel user, String pin) {
        if (!Pins.valid(pin)) throw new IllegalArgumentException("A PIN is 4 to 8 digits");
        user.credentialManager().getStoredCredentialsByTypeStream(TYPE).toList()
            .forEach(c -> user.credentialManager().removeStoredCredentialById(c.getId()));
        String salt = Codes.newSalt();
        CredentialModel m = new CredentialModel();
        m.setType(TYPE);
        m.setUserLabel("Dock PIN");
        m.setCreatedDate(Time.currentTimeMillis());
        try {
            m.setSecretData(JsonSerialization.writeValueAsString(Map.of("salt", salt, "hash", Pins.hash(pin, salt, Pins.ITERATIONS))));
            m.setCredentialData(JsonSerialization.writeValueAsString(Map.of("algorithm", Pins.ALGORITHM, "iterations", Pins.ITERATIONS)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
        return user.credentialManager().createStoredCredential(m);
    }

    public boolean hasPin(UserModel user) {
        return user.credentialManager().getStoredCredentialsByTypeStream(TYPE).findAny().isPresent();
    }

    @Override
    public CredentialModel createCredential(RealmModel realm, UserModel user, CredentialModel credentialModel) {
        return user.credentialManager().createStoredCredential(credentialModel);
    }

    @Override
    public boolean deleteCredential(RealmModel realm, UserModel user, String credentialId) {
        return user.credentialManager().removeStoredCredentialById(credentialId);
    }

    @Override
    public CredentialModel getCredentialFromModel(CredentialModel model) {
        return model;
    }

    @Override
    public CredentialTypeMetadata getCredentialTypeMetadata(CredentialTypeMetadataContext ctx) {
        return CredentialTypeMetadata.builder()
            .type(TYPE)
            .category(CredentialTypeMetadata.Category.BASIC_AUTHENTICATION)
            .displayName("Dock PIN")
            .helpText("PIN for the Dock app (staff ID + PIN)")
            .removeable(true)
            .build(session);
    }

    @Override
    public boolean supportsCredentialType(String credentialType) {
        return TYPE.equals(credentialType);
    }

    @Override
    public boolean isConfiguredFor(RealmModel realm, UserModel user, String credentialType) {
        return supportsCredentialType(credentialType) && hasPin(user);
    }

    @Override
    @SuppressWarnings("unchecked")
    public boolean isValid(RealmModel realm, UserModel user, CredentialInput input) {
        if (input == null || !supportsCredentialType(input.getType())) return false;
        String pin = input.getChallengeResponse();
        return user.credentialManager().getStoredCredentialsByTypeStream(TYPE).anyMatch(c -> {
            try {
                Map<String, Object> secret = JsonSerialization.readValue(c.getSecretData(), Map.class);
                Map<String, Object> data = JsonSerialization.readValue(c.getCredentialData(), Map.class);
                int iterations = data.get("iterations") instanceof Number n ? n.intValue() : Pins.ITERATIONS;
                return Pins.verify(pin, (String) secret.get("salt"), iterations, (String) secret.get("hash"));
            } catch (Exception e) {
                return false;
            }
        });
    }
}
