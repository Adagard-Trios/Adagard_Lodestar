package lk.waypoint.lodestar.identity;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.jboss.logging.Logger;

/**
 * Sends the sign-in code. Picked by SMS_PROVIDER:
 *  - log (default): writes the code to the Keycloak log (development and the demo; with DEMO_SHOW_CODES=true the
 *    first response also carries it so the app can show it the way the SMS would),
 *  - twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM (SMS, and voice calls that read the code out),
 *  - notifylk: NOTIFYLK_USER_ID, NOTIFYLK_API_KEY, NOTIFYLK_SENDER_ID (Notify.lk, SMS only; voice falls back to SMS).
 * Keycloak has its own sender (the notifications service's adapter is not reachable before sign-in).
 */
public interface SmsSender {
    enum Channel { SMS, VOICE }

    /** Sends the text; throws when the provider refused it. */
    void send(String e164, String text, String code, Channel channel) throws Exception;

    String name();

    static SmsSender fromEnv(Function<String, String> env) {
        String p = env.apply("SMS_PROVIDER");
        p = p == null || p.isBlank() ? "log" : p.trim().toLowerCase();
        switch (p) {
            case "twilio":
                return new Twilio(req(env, "TWILIO_ACCOUNT_SID"), req(env, "TWILIO_AUTH_TOKEN"), req(env, "TWILIO_FROM"));
            case "notifylk":
                return new NotifyLk(req(env, "NOTIFYLK_USER_ID"), req(env, "NOTIFYLK_API_KEY"), req(env, "NOTIFYLK_SENDER_ID"));
            case "log":
                return new Log();
            default:
                throw new IllegalArgumentException("SMS_PROVIDER must be log, twilio or notifylk, not " + p);
        }
    }

    private static String req(Function<String, String> env, String key) {
        String v = env.apply(key);
        if (v == null || v.isBlank()) throw new IllegalArgumentException(key + " is required for this SMS_PROVIDER");
        return v.trim();
    }

    final class Log implements SmsSender {
        private static final Logger LOG = Logger.getLogger(Log.class);

        @Override
        public void send(String e164, String text, String code, Channel channel) {
            LOG.infof("[sms:log] %s to %s: %s", channel == Channel.VOICE ? "voice call" : "SMS", Codes.mask(e164), text);
        }

        @Override
        public String name() {
            return "log";
        }
    }

    final class Twilio implements SmsSender {
        private final String sid, token, from;
        private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

        Twilio(String sid, String token, String from) {
            this.sid = sid;
            this.token = token;
            this.from = from;
        }

        @Override
        public void send(String e164, String text, String code, Channel channel) throws Exception {
            String spoken = String.join(", ", code.split(""));
            Map<String, String> form = channel == Channel.VOICE
                ? Map.of("To", e164, "From", from, "Twiml",
                    "<Response><Say>Your Lodestar code is " + spoken + ". Again: " + spoken + ".</Say></Response>")
                : Map.of("To", e164, "From", from, "Body", text);
            String path = channel == Channel.VOICE ? "Calls.json" : "Messages.json";
            HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.twilio.com/2010-04-01/Accounts/" + sid + "/" + path))
                .timeout(Duration.ofSeconds(10))
                .header("Authorization", "Basic " + Base64.getEncoder().encodeToString((sid + ":" + token).getBytes(StandardCharsets.UTF_8)))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(urlForm(form)))
                .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() / 100 != 2) throw new IllegalStateException("Twilio answered " + res.statusCode());
        }

        @Override
        public String name() {
            return "twilio";
        }
    }

    final class NotifyLk implements SmsSender {
        private final String userId, apiKey, senderId;
        private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

        NotifyLk(String userId, String apiKey, String senderId) {
            this.userId = userId;
            this.apiKey = apiKey;
            this.senderId = senderId;
        }

        @Override
        public void send(String e164, String text, String code, Channel channel) throws Exception {
            // Notify.lk has no voice calls: a voice request is sent as SMS.
            String to = e164.startsWith("+") ? e164.substring(1) : e164;
            Map<String, String> q = Map.of("user_id", userId, "api_key", apiKey, "sender_id", senderId, "to", to, "message", text);
            HttpRequest req = HttpRequest.newBuilder(URI.create("https://app.notify.lk/api/v1/send?" + urlForm(q)))
                .timeout(Duration.ofSeconds(10)).GET().build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() / 100 != 2 || !res.body().contains("success")) {
                throw new IllegalStateException("Notify.lk answered " + res.statusCode());
            }
        }

        @Override
        public String name() {
            return "notifylk";
        }
    }

    static String urlForm(Map<String, String> m) {
        return m.entrySet().stream()
            .map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
            .collect(Collectors.joining("&"));
    }
}
