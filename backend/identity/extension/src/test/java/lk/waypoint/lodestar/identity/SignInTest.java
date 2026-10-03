package lk.waypoint.lodestar.identity;

import static org.junit.jupiter.api.Assertions.*;

import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class SignInTest {
    /** In-memory stand-in for Keycloak's single-use object store. */
    static final class MapStore implements OtpService.Store {
        final Map<String, Map<String, String>> m = new HashMap<>();

        public Map<String, String> get(String k) {
            return m.get(k);
        }

        public void put(String k, long life, Map<String, String> n) {
            m.put(k, new HashMap<>(n));
        }

        public void remove(String k) {
            m.remove(k);
        }
    }

    @Test
    void normalizesSriLankanMobileNumbers() {
        assertEquals("+94773184526", Codes.normalizePhone("77 318 4526"));
        assertEquals("+94773184526", Codes.normalizePhone("0773184526"));
        assertEquals("+94773184526", Codes.normalizePhone("+94 77 318 4526"));
        assertEquals("+94773184526", Codes.normalizePhone("0094773184526"));
        assertEquals("+94773184526", Codes.normalizePhone("94773184526"));
        assertNull(Codes.normalizePhone("call me"));
        assertNull(Codes.normalizePhone("12"));
        assertEquals("45 26", Codes.hint("+94773184526"));
    }

    @Test
    void codesAreSixDigitsAndOnlyTheHashIsKept() {
        String c = Codes.newCode();
        assertTrue(c.matches("\\d{6}"));
        String salt = Codes.newSalt();
        String h = Codes.hash(salt, c);
        assertFalse(h.contains(c));
        assertTrue(Codes.matches(salt, h, c));
        assertFalse(Codes.matches(salt, h, c.equals("000000") ? "111111" : "000000"));
    }

    @Test
    void issueCheckOkIsSingleUse() {
        MapStore store = new MapStore();
        OtpService s = new OtpService(store);
        OtpService.Issued i = s.issue("phone:+94771234567", "user-1", 1_000);
        assertEquals(OtpService.IssueStatus.SENT, i.status());
        assertTrue(store.m.values().stream().noneMatch(n -> n.containsValue(i.code())), "code stored in clear");
        OtpService.Checked ok = s.check("phone:+94771234567", i.code(), 2_000);
        assertEquals(OtpService.CheckStatus.OK, ok.status());
        assertEquals("user-1", ok.subject());
        assertEquals(OtpService.CheckStatus.EXPIRED, s.check("phone:+94771234567", i.code(), 3_000).status());
    }

    @Test
    void expiresAfterFiveMinutes() {
        OtpService s = new OtpService(new MapStore());
        OtpService.Issued i = s.issue("k", "u", 0);
        assertEquals(OtpService.CheckStatus.EXPIRED, s.check("k", i.code(), 300_001).status());
    }

    @Test
    void fiveWrongTriesVoidTheCode() {
        OtpService s = new OtpService(new MapStore());
        OtpService.Issued i = s.issue("k", "u", 0);
        String wrong = i.code().equals("123456") ? "654321" : "123456";
        for (int n = 4; n >= 1; n--) {
            OtpService.Checked c = s.check("k", wrong, 1_000);
            assertEquals(OtpService.CheckStatus.WRONG, c.status());
            assertEquals(n, c.attemptsLeft());
        }
        assertEquals(OtpService.CheckStatus.LOCKED, s.check("k", wrong, 1_000).status());
        assertEquals(OtpService.CheckStatus.EXPIRED, s.check("k", i.code(), 1_000).status());
    }

    @Test
    void resendCooldownAndHourlyLimit() {
        OtpService s = new OtpService(new MapStore());
        assertEquals(OtpService.IssueStatus.SENT, s.issue("k", "u", 0).status());
        OtpService.Issued again = s.issue("k", "u", 10_000);
        assertEquals(OtpService.IssueStatus.COOLDOWN, again.status());
        assertEquals(20, again.retryAfterSeconds());
        long t = 0;
        for (int n = 2; n <= 5; n++) {
            t += 31_000;
            assertEquals(OtpService.IssueStatus.SENT, s.issue("k", "u", t).status(), "send " + n);
        }
        t += 31_000;
        assertEquals(OtpService.IssueStatus.RATE_LIMITED, s.issue("k", "u", t).status());
        assertEquals(OtpService.IssueStatus.SENT, s.issue("k", "u", 3_600_001).status());
    }

    @Test
    void pinsHashAndVerify() {
        String salt = Codes.newSalt();
        String h = Pins.hash("2468", salt, 1000);
        assertTrue(Pins.verify("2468", salt, 1000, h));
        assertFalse(Pins.verify("2469", salt, 1000, h));
        assertFalse(Pins.valid("12"));
        assertFalse(Pins.valid("abcd"));
        assertTrue(Pins.valid("2468"));
    }

    @Test
    void smsProviderFromEnv() {
        assertEquals("log", SmsSender.fromEnv(k -> null).name());
        Map<String, String> tw = Map.of("SMS_PROVIDER", "twilio", "TWILIO_ACCOUNT_SID", "AC1", "TWILIO_AUTH_TOKEN", "t", "TWILIO_FROM", "+1555");
        assertEquals("twilio", SmsSender.fromEnv(tw::get).name());
        assertThrows(IllegalArgumentException.class, () -> SmsSender.fromEnv(Map.of("SMS_PROVIDER", "notifylk")::get));
        assertThrows(IllegalArgumentException.class, () -> SmsSender.fromEnv(Map.of("SMS_PROVIDER", "pigeon")::get));
    }
}
