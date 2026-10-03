package lk.waypoint.lodestar.identity;

import java.util.Arrays;
import java.util.List;
import java.util.function.Function;
import org.jboss.logging.Logger;
import org.keycloak.Config;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.AuthenticatorFactory;
import org.keycloak.models.AuthenticationExecutionModel;
import org.keycloak.models.AuthenticationFlowModel;
import org.keycloak.models.ClientModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.models.RealmModel;
import org.keycloak.models.RoleModel;
import org.keycloak.models.utils.KeycloakModelUtils;
import org.keycloak.models.utils.PostMigrationEvent;
import org.keycloak.provider.ProviderConfigProperty;

/**
 * Registers the "lodestar-direct-grant" authenticator and, once Keycloak has started (after the realm import),
 * makes sure the realm uses it (LODESTAR_SIGNIN_BOOTSTRAP=false turns this off):
 *  - a top-level flow "lodestar direct grant" with this one execution,
 *  - bound as the direct-grant flow of the public clients in LODESTAR_SIGNIN_CLIENTS (default lodestar-web,
 *    lodestar-field), which get direct access grants enabled. Confidential service clients are untouched (no
 *    service gets to sign in as a user),
 *  - when LODESTAR_DEMO_PIN is set: a Dock PIN for every loader who has none (demo seed).
 * deploy/azure-demo/realm-signin.sh does the same through kcadm for a running realm.
 */
public class LodestarDirectGrantAuthenticatorFactory implements AuthenticatorFactory {
    private static final Logger LOG = Logger.getLogger(LodestarDirectGrantAuthenticatorFactory.class);

    public static final String PROVIDER_ID = "lodestar-direct-grant";
    public static final String FLOW_ALIAS = "lodestar direct grant";

    private LodestarDirectGrantAuthenticator authenticator;

    @Override
    public Authenticator create(KeycloakSession session) {
        return authenticator;
    }

    @Override
    public void init(Config.Scope config) {
        Function<String, String> env = LodestarDirectGrantAuthenticator.env();
        SmsSender sender;
        try {
            sender = SmsSender.fromEnv(env);
        } catch (IllegalArgumentException e) {
            LOG.errorf("%s; sign-in codes are only logged until it is fixed", e.getMessage());
            sender = new SmsSender.Log();
        }
        boolean show = "true".equalsIgnoreCase(env.apply("DEMO_SHOW_CODES"));
        LOG.infof("Lodestar sign-in: SMS via %s%s", sender.name(), show ? ", codes shown in the response (DEMO_SHOW_CODES)" : "");
        authenticator = new LodestarDirectGrantAuthenticator(sender, show);
    }

    @Override
    public void postInit(KeycloakSessionFactory factory) {
        if ("false".equalsIgnoreCase(System.getenv("LODESTAR_SIGNIN_BOOTSTRAP"))) return;
        factory.register(event -> {
            if (event instanceof PostMigrationEvent) {
                try {
                    KeycloakModelUtils.runJobInTransaction(factory, LodestarDirectGrantAuthenticatorFactory::bootstrap);
                } catch (RuntimeException e) {
                    LOG.errorf(e, "Lodestar sign-in bootstrap failed; run deploy/azure-demo/realm-signin.sh");
                }
            }
        });
    }

    static void bootstrap(KeycloakSession session) {
        String realmName = env("LODESTAR_SIGNIN_REALM", "lodestar");
        RealmModel realm = session.realms().getRealmByName(realmName);
        if (realm == null) return;
        session.getContext().setRealm(realm);
        AuthenticationFlowModel flow = realm.getFlowByAlias(FLOW_ALIAS);
        if (flow == null) {
            flow = new AuthenticationFlowModel();
            flow.setAlias(FLOW_ALIAS);
            flow.setDescription("Lodestar sign-in screens: phone + SMS code, staff ID + PIN, email + password + 2-step");
            flow.setProviderId("basic-flow");
            flow.setTopLevel(true);
            flow.setBuiltIn(false);
            flow = realm.addAuthenticationFlow(flow);
            AuthenticationExecutionModel ex = new AuthenticationExecutionModel();
            ex.setParentFlow(flow.getId());
            ex.setAuthenticator(PROVIDER_ID);
            ex.setRequirement(AuthenticationExecutionModel.Requirement.REQUIRED);
            ex.setPriority(10);
            ex.setAuthenticatorFlow(false);
            realm.addAuthenticatorExecution(ex);
            LOG.infof("Lodestar sign-in: created flow '%s' in realm %s", FLOW_ALIAS, realmName);
        }
        for (String clientId : Arrays.stream(env("LODESTAR_SIGNIN_CLIENTS", "lodestar-web,lodestar-field").split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList()) {
            ClientModel client = realm.getClientByClientId(clientId);
            if (client == null || !client.isPublicClient()) continue;
            if (!client.isDirectAccessGrantsEnabled()) client.setDirectAccessGrantsEnabled(true);
            if (!flow.getId().equals(client.getAuthenticationFlowBindingOverride("direct_grant"))) {
                client.setAuthenticationFlowBindingOverride("direct_grant", flow.getId());
                LOG.infof("Lodestar sign-in: %s uses '%s' for direct grants", clientId, FLOW_ALIAS);
            }
        }
        String pin = System.getenv("LODESTAR_DEMO_PIN");
        RoleModel loader = realm.getRole("loader");
        if (pin != null && Pins.valid(pin.trim()) && loader != null) {
            PinCredentialProvider pins = new PinCredentialProvider(session);
            session.users().getRoleMembersStream(realm, loader).filter(u -> !pins.hasPin(u)).toList().forEach(u -> {
                pins.setPin(realm, u, pin.trim());
                LOG.infof("Lodestar sign-in: demo Dock PIN set for %s", u.getUsername());
            });
        }
    }

    private static String env(String key, String fallback) {
        String v = System.getenv(key);
        return v == null || v.isBlank() ? fallback : v.trim();
    }

    @Override
    public String getId() {
        return PROVIDER_ID;
    }

    @Override
    public String getDisplayType() {
        return "Lodestar direct grant (phone code, PIN, password + 2-step)";
    }

    @Override
    public String getReferenceCategory() {
        return "lodestar-signin";
    }

    @Override
    public boolean isConfigurable() {
        return false;
    }

    @Override
    public AuthenticationExecutionModel.Requirement[] getRequirementChoices() {
        return new AuthenticationExecutionModel.Requirement[] { AuthenticationExecutionModel.Requirement.REQUIRED };
    }

    @Override
    public boolean isUserSetupAllowed() {
        return false;
    }

    @Override
    public String getHelpText() {
        return "Signs in from Lodestar's own screens through the token endpoint: phone + SMS code, staff ID + PIN, or email + password with a second step.";
    }

    @Override
    public List<ProviderConfigProperty> getConfigProperties() {
        return List.of();
    }

    @Override
    public void close() {}
}
