package lk.waypoint.lodestar.identity;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;
import org.keycloak.events.admin.OperationType;
import org.keycloak.events.admin.ResourceType;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.services.resources.admin.AdminEventBuilder;
import org.keycloak.services.resources.admin.permissions.AdminPermissionEvaluator;

/**
 * Admin API for Dock PINs: POST /admin/realms/{realm}/lodestar-pin/{userId} {"pin":"2468"} sets (replaces) the PIN,
 * DELETE removes it. Needs manage-users on that user (the admin console's rule); the PIN is never echoed back.
 * Used by deploy/azure-demo/realm-signin.sh through kcadm.
 */
public class PinAdminResource {
    private final KeycloakSession session;
    private final RealmModel realm;
    private final AdminPermissionEvaluator auth;
    private final AdminEventBuilder adminEvent;

    public PinAdminResource(KeycloakSession session, RealmModel realm, AdminPermissionEvaluator auth, AdminEventBuilder adminEvent) {
        this.session = session;
        this.realm = realm;
        this.auth = auth;
        this.adminEvent = adminEvent;
    }

    @POST
    @Path("{userId}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response set(@PathParam("userId") String userId, Map<String, Object> body) {
        UserModel user = user(userId);
        Object pin = body == null ? null : body.get("pin");
        if (!(pin instanceof String) || !Pins.valid((String) pin)) {
            return Response.status(400).type(MediaType.APPLICATION_JSON).entity("{\"error\":\"A PIN is 4 to 8 digits\"}").build();
        }
        new PinCredentialProvider(session).setPin(realm, user, (String) pin);
        adminEvent.operation(OperationType.UPDATE).resource(ResourceType.USER).resourcePath(session.getContext().getUri()).success();
        return Response.noContent().build();
    }

    @DELETE
    @Path("{userId}")
    public Response remove(@PathParam("userId") String userId) {
        UserModel user = user(userId);
        user.credentialManager().getStoredCredentialsByTypeStream(PinCredentialProvider.TYPE).toList()
            .forEach(c -> user.credentialManager().removeStoredCredentialById(c.getId()));
        adminEvent.operation(OperationType.DELETE).resource(ResourceType.USER).resourcePath(session.getContext().getUri()).success();
        return Response.noContent().build();
    }

    private UserModel user(String userId) {
        UserModel user = session.users().getUserById(realm, userId);
        if (user == null) {
            auth.users().requireQuery();
            throw new NotFoundException("User not found");
        }
        auth.users().requireManage(user);
        return user;
    }
}
