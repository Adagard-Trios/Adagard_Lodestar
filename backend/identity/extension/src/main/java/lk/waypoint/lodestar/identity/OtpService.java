package lk.waypoint.lodestar.identity;

import java.util.HashMap;
import java.util.Map;

/**
 * One-time sign-in codes: issue (5-minute expiry, 30 s resend cooldown, at most 5 codes an hour per key) and check
 * (at most 5 tries, then the code is void). Only a salted hash is stored. The store is Keycloak's single-use object
 * store in production (cluster wide, expires on its own) and a map in the unit tests.
 */
public final class OtpService {
    public interface Store {
        Map<String, String> get(String key);

        void put(String key, long lifespanSeconds, Map<String, String> notes);

        void remove(String key);
    }

    public static final int TTL_SECONDS = 300;
    public static final int MAX_ATTEMPTS = 5;
    public static final int COOLDOWN_SECONDS = 30;
    /** Codes per number per hour: OTP_MAX_SENDS_PER_HOUR, else 5 (50 on a demo stack that shows codes on screen). */
    public static final int MAX_SENDS_PER_HOUR = maxSendsPerHour();

    private static int maxSendsPerHour() {
        try {
            String v = System.getenv("OTP_MAX_SENDS_PER_HOUR");
            if (v != null && !v.isBlank()) return Math.max(1, Integer.parseInt(v.trim()));
        } catch (NumberFormatException ignored) { }
        return "true".equalsIgnoreCase(System.getenv("DEMO_SHOW_CODES")) ? 50 : 5;
    }

    public enum IssueStatus { SENT, COOLDOWN, RATE_LIMITED }

    public enum CheckStatus { OK, WRONG, EXPIRED, LOCKED }

    public record Issued(IssueStatus status, String code, int retryAfterSeconds) {}

    public record Checked(CheckStatus status, String subject, int attemptsLeft) {}

    private final Store store;

    public OtpService(Store store) {
        this.store = store;
    }

    /**
     * Issues a new code for `key` (one code per key: a resend replaces the old one) on behalf of `subject` (the
     * user id, or "" when nobody has that number: the caller gets the same answer either way).
     */
    public Issued issue(String key, String subject, long now) {
        Map<String, String> cur = store.get(codeKey(key));
        if (cur != null) {
            long sentAt = num(cur.get("t"));
            long wait = sentAt + COOLDOWN_SECONDS * 1000L - now;
            if (wait > 0) return new Issued(IssueStatus.COOLDOWN, null, (int) Math.ceil(wait / 1000.0));
        }
        Map<String, String> rate = store.get(rateKey(key));
        long windowStart = rate == null ? now : num(rate.get("w"));
        int sends = rate == null ? 0 : (int) num(rate.get("n"));
        if (now - windowStart >= 3_600_000L) {
            windowStart = now;
            sends = 0;
        }
        if (sends >= MAX_SENDS_PER_HOUR) {
            return new Issued(IssueStatus.RATE_LIMITED, null, (int) Math.ceil((windowStart + 3_600_000L - now) / 1000.0));
        }
        Map<String, String> r = new HashMap<>();
        r.put("w", Long.toString(windowStart));
        r.put("n", Integer.toString(sends + 1));
        store.put(rateKey(key), Math.max(1, (windowStart + 3_600_000L - now) / 1000), r);

        String code = Codes.newCode();
        String salt = Codes.newSalt();
        Map<String, String> notes = new HashMap<>();
        notes.put("h", Codes.hash(salt, code));
        notes.put("s", salt);
        notes.put("e", Long.toString(now + TTL_SECONDS * 1000L));
        notes.put("t", Long.toString(now));
        notes.put("a", "0");
        notes.put("u", subject == null ? "" : subject);
        store.put(codeKey(key), TTL_SECONDS, notes);
        return new Issued(IssueStatus.SENT, code, COOLDOWN_SECONDS);
    }

    /** Checks a typed code. OK removes it (single use); every wrong try counts, the fifth voids it. */
    public Checked check(String key, String typed, long now) {
        Map<String, String> cur = store.get(codeKey(key));
        if (cur == null || num(cur.get("e")) <= now) {
            if (cur != null) store.remove(codeKey(key));
            return new Checked(CheckStatus.EXPIRED, null, 0);
        }
        int attempts = (int) num(cur.get("a"));
        if (attempts >= MAX_ATTEMPTS) {
            store.remove(codeKey(key));
            return new Checked(CheckStatus.LOCKED, null, 0);
        }
        if (typed != null && typed.trim().matches("\\d{6}") && Codes.matches(cur.get("s"), cur.get("h"), typed)) {
            store.remove(codeKey(key));
            return new Checked(CheckStatus.OK, cur.get("u"), MAX_ATTEMPTS - attempts);
        }
        attempts++;
        if (attempts >= MAX_ATTEMPTS) {
            store.remove(codeKey(key));
            return new Checked(CheckStatus.LOCKED, null, 0);
        }
        Map<String, String> next = new HashMap<>(cur);
        next.put("a", Integer.toString(attempts));
        store.put(codeKey(key), Math.max(1, (num(cur.get("e")) - now) / 1000), next);
        return new Checked(CheckStatus.WRONG, null, MAX_ATTEMPTS - attempts);
    }

    private static String codeKey(String key) {
        return "lodestar-otp:" + Codes.sha256(key);
    }

    private static String rateKey(String key) {
        return "lodestar-otp-rate:" + Codes.sha256(key);
    }

    private static long num(String s) {
        try {
            return s == null ? 0 : Long.parseLong(s);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
