package lk.waypoint.lodestar.identity;

import java.security.MessageDigest;
import java.security.spec.KeySpec;
import java.util.Base64;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

/** PIN hashing (PBKDF2-HMAC-SHA256, per-PIN salt). Pure, unit tested. */
public final class Pins {
    private Pins() {}

    public static final String ALGORITHM = "pbkdf2-sha256";
    public static final int ITERATIONS = 210_000;

    /** A PIN is 4 to 8 digits. */
    public static boolean valid(String pin) {
        return pin != null && pin.matches("\\d{4,8}");
    }

    public static String hash(String pin, String salt, int iterations) {
        try {
            KeySpec spec = new PBEKeySpec(pin.toCharArray(), Base64.getDecoder().decode(salt), iterations, 256);
            byte[] key = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
            return Base64.getEncoder().encodeToString(key);
        } catch (Exception e) {
            throw new IllegalStateException("PBKDF2 unavailable", e);
        }
    }

    public static boolean verify(String pin, String salt, int iterations, String expected) {
        if (!valid(pin) || salt == null || expected == null) return false;
        return MessageDigest.isEqual(hash(pin, salt, iterations).getBytes(), expected.getBytes());
    }
}
