/**
 * 08 – Menu Structure
 *
 * Verifies:
 *  1. "Repair Diagnosis" sub-menu exists under Helpdesk top nav (sequence 101)
 *  2. All 10 sub-menus under Repair Diagnosis
 *  3. "Repair Accounts" under Helpdesk > Configuration
 *  4. "Repair Job Details" and "Repair Sales Order List" under Helpdesk > Reporting
 *  5. Each menu item loads its list view without error
 */

const { test, expect } = require('@playwright/test');
const { login, goToHelpdesk, clickMenuPath } = require('../helpers/odoo');

const DIAGNOSIS_SUBMENUS = [
  'Symptom Areas',
  'Symptom Codes',
  'Diagnosis Areas',
  'Diagnosis Codes',
  'Repair Reason',
  'Repair Reason - Customer',
  'Repair Sub Reason',
  'Resolutions',
  'Repair Stages',
  'Conditions',
];

test.describe('08 – Menu Structure', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToHelpdesk(page);
  });

  // -------------------------------------------------------------------------
  // Top-level Repair Diagnosis menu
  // -------------------------------------------------------------------------
  test('Repair Diagnosis menu exists under Helpdesk', async ({ page }) => {
    const repairDiagnosisMenu = page
      .locator('.o_menu_sections a, .o_menu_sections .o_nav_entry, .o_menu_sections button')
      .filter({ hasText: 'Repair Diagnosis' })
      .first();
    await expect(repairDiagnosisMenu).toBeVisible({ timeout: 10000 });
  });

  // -------------------------------------------------------------------------
  // All 10 sub-menus under Repair Diagnosis
  // -------------------------------------------------------------------------
  for (const submenu of DIAGNOSIS_SUBMENUS) {
    test(`Repair Diagnosis > ${submenu} – loads list view`, async ({ page }) => {
      await clickMenuPath(page, 'Repair Diagnosis', submenu);

      // Verify a list view loaded (either o_list_view or o_form_view)
      await expect(
        page.locator('.o_list_view, .o_form_view, .o_kanban_view')
      ).toBeVisible({ timeout: 15000 });

      // Verify no error page
      await expect(page.locator('.o_error_main')).not.toBeVisible();
    });
  }

  // -------------------------------------------------------------------------
  // Configuration > Repair Accounts
  // -------------------------------------------------------------------------
  test('Configuration > Repair Accounts – loads list view', async ({ page }) => {
    await clickMenuPath(page, 'Configuration', 'Repair Accounts');
    await expect(
      page.locator('.o_list_view, .o_form_view')
    ).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.o_error_main')).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Reporting menus
  // -------------------------------------------------------------------------
  test('Reporting > Repair Job Details – loads', async ({ page }) => {
    await clickMenuPath(page, 'Reporting', 'Repair Job Details');
    await expect(
      page.locator('.o_list_view, .o_form_view, .o_graph_view, .o_pivot_view')
    ).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.o_error_main')).not.toBeVisible();
  });

  test('Reporting > Repair Sales Order List – loads', async ({ page }) => {
    await clickMenuPath(page, 'Reporting', 'Repair Sales Order List');
    await expect(
      page.locator('.o_list_view, .o_form_view')
    ).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.o_error_main')).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Smoke test: all 10 sub-menus are visible in the DOM simultaneously
  // -------------------------------------------------------------------------
  test('All 10 Repair Diagnosis sub-menus are present in navigation', async ({ page }) => {
    // Open the Repair Diagnosis dropdown
    const diagMenu = page
      .locator('.o_menu_sections a, .o_menu_sections .o_nav_entry, .o_menu_sections button')
      .filter({ hasText: 'Repair Diagnosis' })
      .first();
    await diagMenu.waitFor({ state: 'visible', timeout: 10000 });
    await diagMenu.click();

    // All sub-menu items should appear in the dropdown
    for (const submenu of DIAGNOSIS_SUBMENUS) {
      const item = page
        .locator('.o_dropdown_item, .dropdown-item, .o_nav_entry')
        .filter({ hasText: submenu })
        .first();
      await expect(item).toBeVisible({ timeout: 5000 });
    }
  });

  // -------------------------------------------------------------------------
  // Repair Accounts under Configuration (not under Repair Diagnosis)
  // -------------------------------------------------------------------------
  test('Repair Accounts is NOT under Repair Diagnosis (correct parent menu)', async ({ page }) => {
    // Click Repair Diagnosis
    const diagMenu = page
      .locator('.o_menu_sections a, .o_menu_sections .o_nav_entry, .o_menu_sections button')
      .filter({ hasText: 'Repair Diagnosis' })
      .first();
    await diagMenu.click();
    await page.waitForLoadState('domcontentloaded');

    // "Repair Accounts" should NOT appear in this dropdown
    const repairAccountsInDiag = page
      .locator('.o_dropdown_item, .dropdown-item')
      .filter({ hasText: 'Repair Accounts' })
      .first();
    await expect(repairAccountsInDiag).not.toBeVisible({ timeout: 3000 });

    // Close any open dropdown
    await page.keyboard.press('Escape');

    // Navigate to Configuration — click the top-level button to open its dropdown
    const configMenu = page
      .locator('.o_menu_sections a, .o_menu_sections .o_nav_entry, .o_menu_sections button')
      .filter({ hasText: 'Configuration' })
      .first();
    await configMenu.waitFor({ state: 'visible', timeout: 10000 });
    await configMenu.click();
    // Wait for the dropdown to actually render its items before asserting
    await page.locator('.o_dropdown_item, .dropdown-item').first()
      .waitFor({ state: 'visible', timeout: 10000 });
    // Repair Accounts should be in the Configuration sub-menu
    const repairAccountsInConfig = page
      .locator('.o_dropdown_item, .dropdown-item, .o_nav_entry')
      .filter({ hasText: 'Repair Accounts' })
      .first();
    await expect(repairAccountsInConfig).toBeVisible({ timeout: 10000 });
  });
});
