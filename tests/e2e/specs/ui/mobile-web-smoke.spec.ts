// UI smoke of the field app's browser build (Expo web export, mobile-web container, host port 8082)
// in a phone viewport. Tappable elements carry testID `lk-<code>`, rendered as data-testid on web.
import { MOBILE_URL } from '../../lib/env';
import { expect, requireUrl, test } from '../../lib/fixtures';

test.describe('Mobile web · field app', () => {
  requireUrl(MOBILE_URL, 'mobile-web');

  test('home offers the field faces', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Waypoint Lodestar', { exact: true })).toBeVisible();
    for (const face of ['Lodestar Store', 'Lodestar Dock', 'Lodestar Run']) await expect(page.getByText(face, { exact: true }).first()).toBeVisible();
  });

  test('store sign-in: Send code opens verification', async ({ page }) => {
    await page.goto('/s/sm-05-sign-in');
    await page.getByTestId('lk-L68').click();
    await expect(page).toHaveURL(/\/s\/sm-06-verify-code$/);
  });

  test('driver dead zone: arrived at stop 1 saves the POD offline', async ({ page }) => {
    await page.goto('/s/dr-a1-offline-run');
    await page.getByTestId('lk-L23').click();
    await expect(page).toHaveURL(/\/s\/dr-a2-pod-saved-offline$/);
  });

  test('splash screens advance by themselves', async ({ page }) => {
    await page.goto('/s/ld-05-splash');
    await expect(page).toHaveURL(/\/s\/ld-06-sign-in$/, { timeout: 10_000 });
  });

  test('an unknown screen key shows "Screen not found"', async ({ page }) => {
    await page.goto('/s/no-such-screen');
    await expect(page.getByText('Screen not found')).toBeVisible();
  });

  test('fits the phone viewport without horizontal scroll', async ({ page }) => {
    await page.goto('/s/dr-a1-offline-run');
    await expect(page.getByTestId('lk-L23')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
