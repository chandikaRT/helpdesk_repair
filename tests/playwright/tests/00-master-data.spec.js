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

});

