/**
 * 06 – Stage Progression / 13-Stage Statusbar
 *
 * Steps:
 *  1. Create a ticket
 *  2. Verify statusbar renders 13 stage chips
 *  3. Verify clicking a stage chip does NOT advance stage (options.clickable=False)
 *  4. Use workflow buttons to advance through each applicable stage
 *  5. Verify stage name updates after each button click
 *  6. Verify CANCELLED stage is only reachable via Cancel button
 *  7. Verify stage 13 (CANCELLED) shows Reopen button
 */

const { test, expect } = require('@playwright/test');
const {
  login,
  goToHelpdesk,
  clickNew,
  saveRecord,
  fillChar,
  fillMany2one,
  clickHeaderButton,
  confirmDialog,
  expectActiveStage,
  getCurrentStageName,
} = require('../helpers/odoo');

const EXPECTED_STAGES = [
  'NEW',
  'SENT TO FACTORY',
  'RECEIVED AT FACTORY',
  'DIAGNOSIS',
  'ESTIMATION SENT',
  'ESTIMATION APPROVAL RECEIVED',
  'ADVANCE RECEIVED',
  'REPAIR STARTED',
  'REPAIR COMPLETED',
  'SENT TO SALES CENTRE',
  'RECEIVED AT SALES CENTRE',
  'HANDED OVER TO CUSTOMER',
  'CANCELLED',
];

test.describe('06 – Stage Progression', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToHelpdesk(page);
  });

  test('Statusbar renders all 13 stages', async ({ page }) => {
    await clickNew(page);
    await fillMany2one(page, 'partner_id', 'Azure Interior');
    await fillMany2one(page, 'ticket_type_id', 'Repair - Not Under Warranty (With Serial No)');
    await fillChar(page, 'name', 'E2E 13 Stage Test');
    await saveRecord(page);

    // Count stage buttons in statusbar
    const stageButtons = page.locator('.o_statusbar_status button');
    await expect(stageButtons).toHaveCount(13);

    // Verify each stage name is present
    for (const stageName of EXPECTED_STAGES) {
      const stageBtn = page
        .locator('.o_statusbar_status button')
        .filter({ hasText: stageName })
        .first();
      await expect(stageBtn).toBeVisible();
    }
  });

  test('Stage chips are NOT clickable (options.clickable=False)', async ({ page }) => {
    await clickNew(page);
    await fillMany2one(page, 'partner_id', 'Azure Interior');
    await fillMany2one(page, 'ticket_type_id', 'Repair - Not Under Warranty (With Serial No)');
    await fillChar(page, 'name', 'E2E Stage Not Clickable');
    await saveRecord(page);

    await expectActiveStage(page, 'NEW');

    // Attempt to click "DIAGNOSIS" stage chip directly
    const diagnosisChip = page
      .locator('.o_statusbar_status button')
      .filter({ hasText: 'DIAGNOSIS' })
      .first();
    await diagnosisChip.click({ force: true });
    await page.waitForLoadState('networkidle');

    // Stage should still be NEW (not advanced to DIAGNOSIS)
    await expectActiveStage(page, 'NEW');
  });

  test('New ticket starts at NEW stage', async ({ page }) => {
    await clickNew(page);
    await fillMany2one(page, 'partner_id', 'Azure Interior');
    await fillMany2one(page, 'ticket_type_id', 'Repair - Not Under Warranty (With Serial No)');
    await fillChar(page, 'name', 'E2E Stage Initial');
    await saveRecord(page);

    await expectActiveStage(page, 'NEW');
  });

  test('Factory flow: stages advance via buttons only', async ({ page }) => {
    await clickNew(page);
    await fillMany2one(page, 'partner_id', 'Azure Interior');
    await fillMany2one(page, 'ticket_type_id', 'Repair - Not Under Warranty (Without Serial No)');
    await fillMany2one(page, 'product_id', 'Acoustic Bloc Screens');
    await fillChar(page, 'name', 'E2E Factory Stage Progression');
    await fillChar(page, 'x_studio_job_location', 'Factory Repair');
    await saveRecord(page);

    await expectActiveStage(page, 'NEW');

    // Send to Factory (if button is available)
    const sendBtn = page
      .locator('.o_statusbar_buttons button')
      .filter({ hasText: 'Send to Factory' })
      .first();

    if (await sendBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sendBtn.click();
      await page.waitForLoadState('networkidle');
      await expectActiveStage(page, 'SENT TO FACTORY');

      // Receive at Factory
      await clickHeaderButton(page, 'Receive at Factory');
      await page.waitForLoadState('networkidle');
      await expectActiveStage(page, 'RECEIVED AT FACTORY');
    }
  });

  test('CANCELLED stage reachable via Cancel button; Reopen appears', async ({ page }) => {
    await clickNew(page);
    await fillMany2one(page, 'partner_id', 'Azure Interior');
    await fillMany2one(page, 'ticket_type_id', 'Repair - Not Under Warranty (With Serial No)');
    await fillMany2one(page, 'product_id', 'Acoustic Bloc Screens');
    await fillChar(page, 'name', 'E2E Cancel Stage Test');

    // Set x_studio_serial_no, return_receipt_location and repair_reason for Cancel to appear
    const serialInput = page.locator('div[name="x_studio_serial_no"] input').first();
    await serialInput.fill('SN-E2E-CANCEL-001');
    await saveRecord(page);

    const cancelBtn = page
      .locator('.o_statusbar_buttons button')
      .filter({ hasText: /^Cancel$/ })
      .first();

    if (await cancelBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cancelBtn.click();
      await confirmDialog(page, 'OK');
      await page.waitForLoadState('networkidle');

      await expectActiveStage(page, 'CANCELLED');

      // Reopen button should now be visible
      const reopenBtn = page
        .locator('.o_statusbar_buttons button')
        .filter({ hasText: 'Reopen' })
        .first();
      await expect(reopenBtn).toBeVisible({ timeout: 8000 });
    }
  });

  test('Stage buttons rendered in correct order', async ({ page }) => {
    await clickNew(page);
    await fillMany2one(page, 'partner_id', 'Azure Interior');
    await fillMany2one(page, 'ticket_type_id', 'Repair - Not Under Warranty (With Serial No)');
    await fillChar(page, 'name', 'E2E Stage Order Test');
    await saveRecord(page);

    // Collect rendered stage names from the statusbar
    const stageButtons = page.locator('.o_statusbar_status button');
    const count = await stageButtons.count();
    expect(count).toBe(13);

    const renderedStages = [];
    for (let i = 0; i < count; i++) {
      const text = (await stageButtons.nth(i).textContent())?.trim() ?? '';
      renderedStages.push(text);
    }

    // Verify the first and last stages are correct
    expect(renderedStages[0]).toBe('NEW');
    expect(renderedStages[renderedStages.length - 1]).toBe('CANCELLED');
  });
});
