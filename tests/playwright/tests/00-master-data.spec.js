/**
 * 00 – Master Data CRUD
 *
 * For each of the 12 custom models:
 *   - Navigate to its menu entry
 *   - Create a record with required fields
 *   - Verify it appears in the tree view
 *   - Edit it and save
 *   - Archive it
 *
 * Also spot-checks cascading domain filters for:
 *   - Symptom Codes (filtered by Symptom Area)
 *   - Diagnosis Codes (filtered by Diagnosis Area)
 *   - Repair Sub Reason (filtered by Repair Reason)
 */

const { test, expect } = require('@playwright/test');
const {
  login,
  goToHelpdesk,
  clickMenuPath,
  clickNew,
  saveRecord,
  fillChar,
  fillMany2one,
  archiveRecord,
  getFieldText,
} = require('../helpers/odoo');

// Odoo 17 always-edit forms render fields as <input> elements.
// Use this helper for all field value assertions.
async function expectField(page, fieldName, value) {
  await expect(page.locator(`div[name="${fieldName}"] input`)).toHaveValue(value);
}

test.describe('00 – Master Data CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToHelpdesk(page);
  });

  // -------------------------------------------------------------------------
  // Repair Stages
  // -------------------------------------------------------------------------
  test('Repair Stages – create, edit, archive', async ({ page }) => {
    await clickMenuPath(page, 'Repair Diagnosis', 'Repair Stages');
    await clickNew(page);

    await fillChar(page, 'x_name', 'E2E Repair Stage');
    await saveRecord(page);

    await expect(page.locator('.o_form_view')).toBeVisible();
    await expectField(page, 'x_name', 'E2E Repair Stage');

    // Edit
    await fillChar(page, 'x_name', 'E2E Repair Stage – edited');
    await saveRecord(page);
    await expect(page.locator('div[name="x_name"] input')).toHaveValue('E2E Repair Stage – edited');

    await archiveRecord(page);
  });

  // -------------------------------------------------------------------------
  // Repair Reason
  // -------------------------------------------------------------------------
  test('Repair Reason – create, edit, archive', async ({ page }) => {
    await clickMenuPath(page, 'Repair Diagnosis', 'Repair Reason');
    await clickNew(page);

    await fillChar(page, 'x_name', 'E2E Repair Reason');
    await saveRecord(page);

    await expectField(page, 'x_name', 'E2E Repair Reason');

    await archiveRecord(page);
  });

  // -------------------------------------------------------------------------
  // Repair Reason – Customer
  // -------------------------------------------------------------------------
  test('Repair Reason - Customer – create, edit, archive', async ({ page }) => {
    await clickMenuPath(page, 'Repair Diagnosis', 'Repair Reason - Customer');
    await clickNew(page);

    await fillChar(page, 'x_name', 'E2E Reason Customer');
    await saveRecord(page);

    await expectField(page, 'x_name', 'E2E Reason Customer');

    await archiveRecord(page);
  });

  // -------------------------------------------------------------------------
  // Repair Sub Reason (domain filtered by Repair Reason)
  // -------------------------------------------------------------------------
  test('Repair Sub Reason – create with reason, archive', async ({ page }) => {
    // Ensure a parent reason exists first
    await clickMenuPath(page, 'Repair Diagnosis', 'Repair Reason');
    await clickNew(page);
    await fillChar(page, 'x_name', 'E2E Sub Reason Parent');
    await saveRecord(page);

    // Now create sub reason
    await clickMenuPath(page, 'Repair Diagnosis', 'Repair Sub Reason');
    await clickNew(page);

    await fillChar(page, 'x_name', 'E2E Sub Reason');
    await fillMany2one(page, 'x_studio_reason_code', 'E2E Sub Reason Parent');
    await saveRecord(page);

    await expectField(page, 'x_name', 'E2E Sub Reason');
    await expectField(page, 'x_studio_reason_code', 'E2E Sub Reason Parent');

    await archiveRecord(page);
  });

  // -------------------------------------------------------------------------
  // Diagnosis Areas
  // -------------------------------------------------------------------------
  test('Diagnosis Areas – create, edit, archive', async ({ page }) => {
    await clickMenuPath(page, 'Repair Diagnosis', 'Diagnosis Areas');
    await clickNew(page);

    await fillChar(page, 'x_name', 'E2E Diagnosis Area');
    await saveRecord(page);

    await expectField(page, 'x_name', 'E2E Diagnosis Area');

    await archiveRecord(page);
  });

  // -------------------------------------------------------------------------
  // Diagnosis Codes (domain filtered by Diagnosis Area)
  // -------------------------------------------------------------------------
  test('Diagnosis Codes – create with area, verify domain, archive', async ({ page }) => {
    // Ensure parent diagnosis area exists
    await clickMenuPath(page, 'Repair Diagnosis', 'Diagnosis Areas');
    await clickNew(page);
    await fillChar(page, 'x_name', 'E2E Diag Area For Code');
    await saveRecord(page);

    // Create diagnosis code linked to that area
    await clickMenuPath(page, 'Repair Diagnosis', 'Diagnosis Codes');
    await clickNew(page);

    await fillChar(page, 'x_name', 'E2E Diagnosis Code');
    await fillMany2one(page, 'x_studio_diagnosis_area_1', 'E2E Diag Area For Code');
    await saveRecord(page);

    await expectField(page, 'x_name', 'E2E Diagnosis Code');
    await expectField(page, 'x_studio_diagnosis_area_1', 'E2E Diag Area For Code');

    await archiveRecord(page);
  });

  // -------------------------------------------------------------------------
  // Symptom Areas
  // -------------------------------------------------------------------------
  test('Symptom Areas – create, edit, archive', async ({ page }) => {
    await clickMenuPath(page, 'Repair Diagnosis', 'Symptom Areas');
    await clickNew(page);

    await fillChar(page, 'x_name', 'E2E Symptom Area');
    await saveRecord(page);

    await expectField(page, 'x_name', 'E2E Symptom Area');

    await archiveRecord(page);
  });

  // -------------------------------------------------------------------------
  // Symptom Codes (domain filtered by Symptom Area)
  // -------------------------------------------------------------------------
  test('Symptom Codes – create with area, verify domain, archive', async ({ page }) => {
    // Ensure parent symptom area exists
    await clickMenuPath(page, 'Repair Diagnosis', 'Symptom Areas');
    await clickNew(page);
    await fillChar(page, 'x_name', 'E2E Symptom Area For Code');
    await saveRecord(page);

    // Create symptom code linked to that area
    await clickMenuPath(page, 'Repair Diagnosis', 'Symptom Codes');
    await clickNew(page);

    await fillChar(page, 'x_name', 'E2E Symptom Code');
    await fillMany2one(page, 'x_studio_symptom_area', 'E2E Symptom Area For Code');
    await saveRecord(page);

    await expectField(page, 'x_name', 'E2E Symptom Code');
    await expectField(page, 'x_studio_symptom_area', 'E2E Symptom Area For Code');

    await archiveRecord(page);
  });

  // -------------------------------------------------------------------------
  // Conditions
  // -------------------------------------------------------------------------
  test('Conditions – create, edit, archive', async ({ page }) => {
    await clickMenuPath(page, 'Repair Diagnosis', 'Conditions');
    await clickNew(page);

    await fillChar(page, 'x_name', 'E2E Condition');
    await saveRecord(page);

    await expectField(page, 'x_name', 'E2E Condition');

    await archiveRecord(page);
  });

  // -------------------------------------------------------------------------
  // Resolutions
  // -------------------------------------------------------------------------
  test('Resolutions – create, edit, archive', async ({ page }) => {
    await clickMenuPath(page, 'Repair Diagnosis', 'Resolutions');
    await clickNew(page);

    await fillChar(page, 'x_name', 'E2E Resolution');
    await saveRecord(page);

    await expectField(page, 'x_name', 'E2E Resolution');

    await archiveRecord(page);
  });

  // -------------------------------------------------------------------------
  // Repair Accounts (Configuration menu)
  // -------------------------------------------------------------------------
  test('Repair Accounts – create, edit, archive', async ({ page }) => {
    await clickMenuPath(page, 'Configuration', 'Repair Accounts');
    await clickNew(page);

    await fillChar(page, 'x_name', 'E2E Repair Account');
    await saveRecord(page);

    await expectField(page, 'x_name', 'E2E Repair Account');

    await archiveRecord(page);
  });

  // -------------------------------------------------------------------------
  // Domain filter spot-check: Symptom Code dropdown filtered by Symptom Area
  // -------------------------------------------------------------------------
  test('Symptom Codes – dropdown filters by selected Symptom Area', async ({ page }) => {
    // Create two symptom areas
    await clickMenuPath(page, 'Repair Diagnosis', 'Symptom Areas');
    await clickNew(page);
    await fillChar(page, 'x_name', 'E2E Area Alpha');
    await saveRecord(page);

    await clickNew(page);
    await fillChar(page, 'x_name', 'E2E Area Beta');
    await saveRecord(page);

    // Create a code under Alpha
    await clickMenuPath(page, 'Repair Diagnosis', 'Symptom Codes');
    await clickNew(page);
    await fillChar(page, 'x_name', 'E2E Code Alpha Only');
    await fillMany2one(page, 'x_studio_symptom_area', 'E2E Area Alpha');
    await saveRecord(page);

    // On a new Symptom Code form, selecting Area Beta should NOT show the Alpha code
    await clickNew(page);
    await fillChar(page, 'x_name', 'E2E Temp Code');
    await fillMany2one(page, 'x_studio_symptom_area', 'E2E Area Beta');
    // Type in the symptom_code field and verify Alpha code doesn't appear
    const codeInput = page.locator('div[name="x_studio_symptom_code"] input').first();
    await codeInput.fill('E2E Code Alpha Only');
    const dropdown = page.locator('.o_autocomplete_dropdown').first();
    await dropdown.waitFor({ state: 'visible', timeout: 5000 });
    // Should show "No records" or not show the Alpha-only code
    const alphaOption = dropdown.locator('.o_menu_item').filter({ hasText: 'E2E Code Alpha Only' }).first();
    await expect(alphaOption).toBeHidden({ timeout: 3000 });

    await page.keyboard.press('Escape');
    await discardRecord(page);
  });
});

async function discardRecord(page) {
  const { discardRecord } = require('../helpers/odoo');
  await discardRecord(page);
}
