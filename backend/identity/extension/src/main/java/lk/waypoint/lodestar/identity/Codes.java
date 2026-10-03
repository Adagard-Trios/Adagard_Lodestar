package lk.waypoint.lodestar.identity;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Locale;

/** Pure helpers (unit tested): one-time codes, their hashes, and Sri Lankan mobile numbers. */
public final class Codes {
    private Codes() {}

    private static final SecureRandom RANDOM = new SecureRandom();

    /** A uniformly random 6-digit code ("000000" to "999999"). */
    public static String newCode() {
        return String.format(Locale.ROOT, "%06d", RANDOM.nextInt(1_000_000));
    }

    public static String newSalt() {
        byte[] b = new byte[16];
        RANDOM.nextBytes(b);
        return Base64.getEncoder().encodeToString(b);
    }

    /** SHA-256 of salt + code. The code never leaves the server except in the SMS (and the demo display). */
    public static String hash(String salt, String code) {
        return sha256(salt + ":" + code);
    }

    /** Constant-time comparison of a typed code with the stored hash. */
    public static boolean matches(String salt, String storedHash, String typed) {
        if (salt == null || storedHash == null || typed == null) return false;
        byte[] a = hash(salt, typed.trim()).getBytes(StandardCharsets.US_ASCII);
        byte[] b = storedHash.getBytes(StandardCharsets.US_ASCII);
        return MessageDigest.isEqual(a, b);
    }

    public static String sha256(String s) {
        try {
            byte[] d = MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(d);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    /**
     * A mobile number as E.164 (+94771234567), or null when it is not one. Accepts what people type on the
     * sign-in screens: "77 123 4567", "0771234567", "+94 77 123 4567", "0094771234567". Numbers with another
     * country code are kept as given (digits only, with the plus).
     */
    public static String normalizePhone(String raw) {
        if (raw == null) return null;
        String s = raw.trim();
        boolean plus = s.startsWith("+");
        String digits = s.replaceAll("[\\s().-]", "");
        if (plus) digits = digits.substring(1);
        if (!digits.matches("\\d{6,15}")) return null;
        if (!plus && digits.startsWith("00")) {
            digits = digits.substring(2);
            plus = true;
        }
        if (plus) return digits.length() >= 8 ? "+" + digits : null;
        if (digits.length() == 10 && digits.startsWith("0")) return "+94" + digits.substring(1);
        if (digits.length() == 9 && digits.startsWith("7")) return "+94" + digits;
        if (digits.length() == 11 && digits.startsWith("94")) return "+" + digits;
        return null;
    }

    /** The last four digits as the designs show them ("ending 47 21"). */
    public static String hint(String e164) {
        if (e164 == null || e164.length() < 4) return "";
        String last = e164.substring(e164.length() - 4);
        return last.substring(0, 2) + " " + last.substring(2);
    }

    /** For logs: +94 77 ••• ••21. */
    public static String mask(String e164) {
        if (e164 == null || e164.length() < 6) return "•••";
        return e164.substring(0, Math.min(5, e164.length() - 2)) + "•••" + e164.substring(e164.length() - 2);
    }
}
