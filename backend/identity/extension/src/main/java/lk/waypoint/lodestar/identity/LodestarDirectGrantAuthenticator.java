package lk.waypoint.lodestar.identity;

import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.core.Response;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import org.jboss.logging.Logger;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.AuthenticationFlowError;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.authenticators.browser.AbstractUsernameFormAuthenticator;
import org.keycloak.credential.CredentialModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.SingleUseObjectProvider;
import org.keycloak.models.UserCredentialModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.credential.OTPCredentialModel;
import org.keycloak.models.utils.KeycloakModelUtils;
import org.keycloak.services.managers.BruteForceProtector;
import org.keycloak.util.JsonSerialization;

/**
 * Lodestar's direct-grant sign-in (token endpoint, grant_type=password), so every role signs in on its own designed
 * screen instead of Keycloak's login page. One execution reads the form and picks the method:
 *
 *  1. phone [+ code] [+ channel=voice]  (SM-05/06, SM-26, DR-06/07, DR-29): without a code a 6-digit code is sent to
 *     the user whose `phone` attribute is that number and the answer is 401 {"error":"code_sent",...}; with the code
 *     Keycloak issues the tokens. Unknown numbers get the same answers (no user enumeration).
 *  2. username (staff ID) + pin  (LD-06): the Dock PIN credential (PinCredentialProvider).
 *  3. username (email) + password [+ totp | code] [+ send=sms|voice]  (DSP-06/07, ADM-01): the password, then a
 *     second step that cannot be skipped: the authenticator-app code when the user has one (401 otp_required),
 *     otherwise (or on "Send the code by SMS instead") a code to the user's phone (401 code_sent).
 *
 * Codes: 5-minute expiry, 5 tries, 30 s resend cooldown, 5 codes an hour per number (OtpService). Failed passwords
 * and PINs count towards the realm's brute-force lockout.
 */
public class LodestarDirectGrantAuthenticator implements Authenticator {
    private static final Logger LOG = Logger.getLogger(LodestarDirectGrantAuthenticator.class);

    static final String PHONE_ATTRIBUTE = "phone";
    static final String STAFF_ID_ATTRIBUTE = "staff_id";
    private static final String GENERIC_PHONE = "That code isn't right. Check the SMS and try again.";
    private static final String GENERIC_PASSWORD = "Wrong email or password.";
    private static final String GENERIC_PIN = "Wrong staff ID or PIN.";

    private final SmsSender sender;
    private final boolean showCodes;

    public LodestarDirectGrantAuthenticator(SmsSender sender, boolean showCodes) {
        this.sender = sender;
        this.showCodes = showCodes;
    }

    static Function<String, String> env() {
        return System::getenv;
    }

    @Override
    public void authenticate(AuthenticationFlowContext context) {
        MultivaluedMap<String, String> form = context.getHttpRequest().getDecodedFormParameters();
        String phone = trim(form.getFirst("phone"));
        String username = trim(form.getFirst("username"));
        String pin = trim(form.getFirst("pin"));
        String password = form.getFirst("password");
        if (phone != null) {
            phoneSignIn(context, form, phone);
        } else if (username != null && pin != null) {
            pinSignIn(context, username, pin);
        } else if (username != null && password != null && !password.isEmpty()) {
            passwordSignIn(context, form, username, password);
        } else {
            context.failure(AuthenticationFlowError.INVALID_CREDENTIALS, error(400, "invalid_request", "Enter your sign-in details.", Map.of()));
        }
    }

    // ------------------------------------------------------------------ 1. phone + SMS code

    private void phoneSignIn(AuthenticationFlowContext context, MultivaluedMap<String, String> form, String rawPhone) {
        String e164 = Codes.normalizePhone(rawPhone);
        if (e164 == null) {
            context.failure(AuthenticationFlowError.INVALID_CREDENTIALS, error(400, "invalid_phone", "Enter your mobile number, like 77 123 4567.", Map.of()));
            return;
        }
        KeycloakSession session = context.getSession();
        RealmModel realm = context.getRealm();
        UserModel user = byAttribute(session, realm, PHONE_ATTRIBUTE, e164).orElse(null);
        OtpService otp = otp(session);
        String key = "phone:" + realm.getId() + ":" + e164;
        String code = trim(form.getFirst("code"));
        if (code == null) {
            boolean voice = "voice".equalsIgnoreCase(trim(form.getFirst("channel")));
            sendCode(context, otp, key, user != null && usable(session, realm, user) ? user : null, e164, voice);
            return;
        }
        OtpService.Checked c = otp.check(key, code, System.currentTimeMillis());
        if (c.status() == OtpService.CheckStatus.OK && user != null && user.getId().equals(c.subject()) && usable(session, realm, user)) {
            context.getEvent().user(user).detail("auth_method", "phone_otp");
            context.setUser(user);
            context.success();
            return;
        }
        codeFailure(context, c.status() == OtpService.CheckStatus.OK ? OtpService.CheckStatus.WRONG : c.status(), c.attemptsLeft(), GENERIC_PHONE);
    }

    // ------------------------------------------------------------------ 2. staff ID + PIN

    private void pinSignIn(AuthenticationFlowContext context, String staffId, String pin) {
        KeycloakSession session = context.getSession();
        RealmModel realm = context.getRealm();
        UserModel user = byAttribute(session, realm, STAFF_ID_ATTRIBUTE, staffId.toUpperCase())
            .or(() -> Optional.ofNullable(KeycloakModelUtils.findUserByNameOrEmail(session, realm, staffId)))
            .orElse(null);
        Response wrong = error(401, "invalid_grant", GENERIC_PIN, Map.of());
        if (user == null) {
            context.failure(AuthenticationFlowError.INVALID_USER, wrong);
            return;
        }
        context.getAuthenticationSession().setAuthNote(AbstractUsernameFormAuthenticator.ATTEMPTED_USERNAME, user.getUsername());
        if (!usable(session, realm, user)) {
            context.failure(AuthenticationFlowError.USER_TEMPORARILY_DISABLED, wrong);
            return;
        }
        if (!user.credentialManager().isValid(new UserCredentialModel(null, PinCredentialProvider.TYPE, pin))) {
            context.getEvent().user(user);
            context.failure(AuthenticationFlowError.INVALID_CREDENTIALS, wrong);
            return;
        }
        context.getEvent().user(user).detail("auth_method", "pin");
        context.setUser(user);
        context.success();
    }

    // ------------------------------------------------------------------ 3. email + password, then a second step

    private void passwordSignIn(AuthenticationFlowContext context, MultivaluedMap<String, String> form, String username, String password) {
        KeycloakSession session = context.getSession();
        RealmModel realm = context.getRealm();
        UserModel user = KeycloakModelUtils.findUserByNameOrEmail(session, realm, username);
        Response wrong = error(401, "invalid_grant", GENERIC_PASSWORD, Map.of());
        if (user == null) {
            context.failure(AuthenticationFlowError.INVALID_USER, wrong);
            return;
        }
        context.getAuthenticationSession().setAuthNote(AbstractUsernameFormAuthenticator.ATTEMPTED_USERNAME, user.getUsername());
        if (!usable(session, realm, user)) {
            context.failure(AuthenticationFlowError.USER_TEMPORARILY_DISABLED, wrong);
            return;
        }
        if (!user.credentialManager().isValid(UserCredentialModel.password(password))) {
            context.getEvent().user(user);
            context.failure(AuthenticationFlowError.INVALID_CREDENTIALS, wrong);
            return;
        }

        // Second step: never skipped.
        Optional<CredentialModel> app = user.credentialManager().getStoredCredentialsByTypeStream(OTPCredentialModel.TYPE).findFirst();
        String e164 = Codes.normalizePhone(user.getFirstAttribute(PHONE_ATTRIBUTE));
        String totp = trim(form.getFirst("totp"));
        String code = trim(form.getFirst("code"));
        String send = trim(form.getFirst("send"));
        OtpService otp = otp(session);
        String key = "user:" + realm.getId() + ":" + user.getId();

        if (totp != null && app.isPresent()) {
            if (user.credentialManager().isValid(new UserCredentialModel(app.get().getId(), OTPCredentialModel.TYPE, totp))) {
                context.getEvent().user(user).detail("auth_method", "password_totp");
                context.setUser(user);
                context.success();
            } else {
                context.getEvent().user(user);
                context.failure(AuthenticationFlowError.INVALID_CREDENTIALS, error(401, "invalid_grant", "That code isn't right. Use the current code from your authenticator app.", Map.of("method", "totp")));
            }
            return;
        }
        if (code != null && e164 != null) {
            OtpService.Checked c = otp.check(key, code, System.currentTimeMillis());
            if (c.status() == OtpService.CheckStatus.OK && user.getId().equals(c.subject())) {
                context.getEvent().user(user).detail("auth_method", "password_sms");
                context.setUser(user);
                context.success();
            } else {
                codeFailure(context, c.status() == OtpService.CheckStatus.OK ? OtpService.CheckStatus.WRONG : c.status(), c.attemptsLeft(), GENERIC_PHONE);
            }
            return;
        }
        if (app.isPresent() && send == null) {
            Map<String, Object> extra = new LinkedHashMap<>();
            extra.put("method", "totp");
            extra.put("sms_available", e164 != null);
            if (e164 != null) extra.put("phone_hint", Codes.hint(e164));
            context.challenge(error(401, "otp_required", "Enter the 6-digit code from your authenticator app.", extra));
            return;
        }
        if (e164 == null) {
            context.failure(AuthenticationFlowError.CREDENTIAL_SETUP_REQUIRED, error(401, "second_factor_unavailable",
                "2-step verification isn't set up for this account. Call the IT desk to add your phone.", Map.of()));
            return;
        }
        sendCode(context, otp, key, user, e164, "voice".equalsIgnoreCase(send));
    }

    // ------------------------------------------------------------------ shared

    /** Issues a code; sends it when `user` is known. The answer is the same either way. */
    private void sendCode(AuthenticationFlowContext context, OtpService otp, String key, UserModel user, String e164, boolean voice) {
        OtpService.Issued issued = otp.issue(key, user == null ? "" : user.getId(), System.currentTimeMillis());
        if (issued.status() == OtpService.IssueStatus.COOLDOWN) {
            context.failure(AuthenticationFlowError.INVALID_CREDENTIALS, error(429, "slow_down",
                "A code was just sent. You can ask for a new one in " + issued.retryAfterSeconds() + " s.", Map.of("retry_after", issued.retryAfterSeconds())));
            return;
        }
        if (issued.status() == OtpService.IssueStatus.RATE_LIMITED) {
            context.failure(AuthenticationFlowError.INVALID_CREDENTIALS, error(429, "too_many_codes",
                "Too many codes for this number. Try again later, or ask your depot to verify you.", Map.of("retry_after", issued.retryAfterSeconds())));
            return;
        }
        if (user != null) {
            String text = "Your Lodestar sign-in code is " + issued.code() + ". It expires in 5 minutes. Never share it. - WAYPOINT";
            try {
                sender.send(e164, text, issued.code(), voice ? SmsSender.Channel.VOICE : SmsSender.Channel.SMS);
            } catch (Exception e) {
                LOG.warnf("Sign-in code to %s not sent via %s: %s", Codes.mask(e164), sender.name(), e.getMessage());
                context.failure(AuthenticationFlowError.INTERNAL_ERROR, error(503, "temporarily_unavailable",
                    "We couldn't send the code just now. Try again in a minute.", Map.of()));
                return;
            }
        }
        Map<String, Object> extra = new LinkedHashMap<>();
        extra.put("method", voice ? "voice" : "sms");
        extra.put("phone_hint", Codes.hint(e164));
        extra.put("expires_in", OtpService.TTL_SECONDS);
        extra.put("resend_in", issued.retryAfterSeconds());
        if (showCodes) extra.put("demo_code", issued.code());
        context.challenge(error(401, "code_sent", voice ? "We're calling you with a 6-digit code." : "We sent a 6-digit code by SMS.", extra));
    }

    private static void codeFailure(AuthenticationFlowContext context, OtpService.CheckStatus status, int left, String wrongText) {
        switch (status) {
            case EXPIRED -> context.failure(AuthenticationFlowError.EXPIRED_CODE, error(401, "code_expired", "That code has expired. Send a new one.", Map.of()));
            case LOCKED -> context.failure(AuthenticationFlowError.INVALID_CREDENTIALS, error(401, "code_locked", "Too many wrong codes. Send a new one.", Map.of()));
            default -> context.failure(AuthenticationFlowError.INVALID_CREDENTIALS, error(401, "invalid_grant", wrongText, Map.of("attempts_left", left)));
        }
    }

    private static OtpService otp(KeycloakSession session) {
        SingleUseObjectProvider s = session.singleUseObjects();
        return new OtpService(new OtpService.Store() {
            @Override
            public Map<String, String> get(String key) {
                return s.get(key);
            }

            @Override
            public void put(String key, long lifespanSeconds, Map<String, String> notes) {
                s.remove(key);
                s.put(key, lifespanSeconds, notes);
            }

            @Override
            public void remove(String key) {
                s.remove(key);
            }
        });
    }

    /** Exactly one non-service-account user with that attribute value, else empty (ambiguous numbers never sign in). */
    static Optional<UserModel> byAttribute(KeycloakSession session, RealmModel realm, String name, String value) {
        List<UserModel> users = session.users().searchForUserByUserAttributeStream(realm, name, value)
            .filter(u -> u.getServiceAccountClientLink() == null)
            .limit(2)
            .toList();
        return users.size() == 1 ? Optional.of(users.get(0)) : Optional.empty();
    }

    private static boolean usable(KeycloakSession session, RealmModel realm, UserModel user) {
        if (!user.isEnabled()) return false;
        if (!realm.isBruteForceProtected()) return true;
        BruteForceProtector bfp = session.getProvider(BruteForceProtector.class);
        return bfp == null || !(bfp.isTemporarilyDisabled(session, realm, user) || bfp.isPermanentlyLockedOut(session, realm, user));
    }

    static Response error(int status, String error, String description, Map<String, ?> extra) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", error);
        body.put("error_description", description);
        body.putAll(extra);
        String json;
        try {
            json = JsonSerialization.writeValueAsString(body);
        } catch (Exception e) {
            json = "{\"error\":\"" + error + "\"}";
        }
        return Response.status(status).type(MediaType.APPLICATION_JSON_TYPE).header("Cache-Control", "no-store").entity(json).build();
    }

    private static String trim(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    @Override
    public void action(AuthenticationFlowContext context) {
        // direct grant: single request, nothing to continue
    }

    @Override
    public boolean requiresUser() {
        return false;
    }

    @Override
    public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) {
        return true;
    }

    @Override
    public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) {}

    @Override
    public void close() {}
}
