const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

async function login(page) {
  await page.goto('/web/login');
  // Wait for the login form specifically (not the Odoo app shell)
  await page.locator('input[name="login"]').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('input[name="login"]').fill(process.env.ODOO_ADMIN_USER);
  await page.locator('input[name="password"]').fill(process.env.ODOO_ADMIN_PASSWORD);
  // Use the primary submit button on the login form specifically
  await page.locator('button.btn-primary[type="submit"], .oe_login_form button[type="submit"]').first().click();
  // /web/login itself matches /(odoo|web)/ so we must wait for a URL that is
  // NOT the login page, otherwise waitForURL fires immediately.
  await page.waitForURL(/\/(odoo|web(?!\/login))/, { timeout: 30000 });
  // Odoo SPA keeps WebSocket/long-poll connections open so networkidle never
  // fires. Wait for the load event instead, then for the app grid.
  await page.waitForLoadState('load', { timeout: 30000 });
  await page.locator('.o_home_menu, .o_app, .o_menu_sections').first()
    .waitFor({ state: 'visible', timeout: 30000 });
}

// ---------------------------------------------------------------------------
// App / menu navigation
// ---------------------------------------------------------------------------

async function goToApp(page, appName) {
  const home = page.locator('.o_menu_toggle, .o_navbar_apps_menu').first();
  if (await home.isVisible()) {
    await home.click();
    await page.waitForSelector('.o_app', { timeout: 5000 }).catch(() => {});
  }
  const appLink = page.locator('.o_app', { hasText: appName }).first();
  if (await appLink.isVisible({ timeout: 3000 })) {
    await appLink.click();
  } else {
    // Try direct navigation for known apps
    const slug = appName.toLowerCase().replace(/\s+/g, '-');
    await page.goto(`/odoo/${slug}`);
  }
  await page.waitForLoadState('networkidle');
}

async function goToHelpdesk(page) {
  // login() already puts us on the Odoo backend. Do NOT call page.goto —
  // a new HTTP navigation loses the backend session on this SaaS instance
  // (the website module intercepts /web and /odoo/* for unauthenticated
  // website sessions and shows 404 or portal login instead).
  // Navigate purely through the Odoo UI.

  // Case A: app home grid is visible — click Helpdesk tile
  const appLink = page.locator('.o_app').filter({ hasText: 'Helpdesk' }).first();
  if (await appLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await appLink.click();
    await page.locator('.o_menu_sections').waitFor({ state: 'visible', timeout: 20000 });
    return;
  }

  // Case B: already inside an app — use the nav toggle to reach the home grid
  const toggle = page.locator('.o_menu_toggle, .o_navbar_apps_menu').first();
  if (await toggle.isVisible({ timeout: 5000 }).catch(() => false)) {
    await toggle.click();
    await page.waitForSelector('.o_app', { timeout: 10000 }).catch(() => {});
    const appAfterToggle = page.locator('.o_app').filter({ hasText: 'Helpdesk' }).first();
    if (await appAfterToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
      await appAfterToggle.click();
      await page.locator('.o_menu_sections').waitFor({ state: 'visible', timeout: 20000 });
      return;
    }
  }

  throw new Error(`[goToHelpdesk] could not navigate to Helpdesk — URL after login: ${page.url()}`);
}

// Navigate a hierarchy of menu labels within the current app.
// Each successive label is a child of the previous.
async function clickMenuPath(page, ...labels) {
  // In Odoo 17, navigating via the top-level menu while on a form view performs
  // a breadcrumb *push* (URL does not update) rather than a fresh action load.
  // When the user then clicks "New" on the pushed list, Odoo only materialises
  // the list URL but never opens the form — breaking clickNew().
  // Fix: if we are currently on a form view, return to the Helpdesk Overview
  // first so the following menu clicks start from a clean action context.
  const currentUrl = page.url();
  if (currentUrl.includes('view_type=form')) {
    const overviewItem = page
      .locator('.o_menu_sections a, .o_menu_sections .o_nav_entry, .o_menu_sections menuitem')
      .filter({ hasText: 'Overview' })
      .first();
    if (await overviewItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await overviewItem.click();
      await page.waitForLoadState('domcontentloaded');
      await page
        .locator('.o_list_view, .o_kanban_view, .o_home_menu, .o_view')
        .first()
        .waitFor({ state: 'visible', timeout: 15000 })
        .catch(() => {});
    }
  }

  for (const label of labels) {
    // The section headers and nav entries share the same menu bar
    const item = page
      .locator('.o_menu_sections a, .o_menu_sections .o_nav_entry, .o_menu_sections button, .o_menu_sections span.o_menu_item')
      .filter({ hasText: label })
      .first();

    // If not directly visible it may be in an already-open dropdown
    const visible = await item.isVisible({ timeout: 4000 }).catch(() => false);
    if (!visible) {
      const dropdownItem = page
        .locator('.o_dropdown_item, .dropdown-item, .o_nav_entry')
        .filter({ hasText: label })
        .first();
      await dropdownItem.waitFor({ state: 'visible', timeout: 8000 });
      await dropdownItem.click();
    } else {
      await item.click();
    }
    await page.waitForLoadState('domcontentloaded');

    // If Odoo shows an "unsaved changes" dialog after navigation, discard it
    const dialog = page.locator('.o_dialog, .modal').first();
    if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      const discardBtn = dialog
        .getByRole('button', { name: /Discard|Leave|OK/i })
        .first();
      if (await discardBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await discardBtn.click();
        await page.waitForLoadState('domcontentloaded');
      }
    }

    // Odoo SPA: domcontentloaded fires before the view is rendered.
    // Wait for a list/form/kanban view to appear before returning so that
    // the next clickNew() call finds a fully-rendered target.
    await page
      .locator('.o_list_view, .o_form_view, .o_kanban_view')
      .first()
      .waitFor({ state: 'visible', timeout: 15000 })
      .catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// List / form controls
// ---------------------------------------------------------------------------

async function clickNew(page) {
  // Odoo 17 renders the real "New" button (visible, breadcrumb action area)
  // and a hidden bounce/CTA button (empty-list illustration). The bounce button
  // is aria-hidden so getByRole only resolves the accessible, visible button.
  const btn = page.getByRole('button', { name: 'New', exact: true }).first();
  await btn.waitFor({ state: 'visible', timeout: 10000 });

  const urlBefore = page.url();
  await btn.click();

  // Wait up to 2s to see if the URL changed (Odoo hash routing)
  await page.waitForTimeout(2000);
  const urlAfter2s = page.url();

  // Wait for a form view with actual field content. Using just '.o_form_view'
  // can match stale/hidden elements from the previous view. Requiring 'div[name]'
  // inside ensures the form has rendered its fields.
  await page.locator('.o_form_view div[name]').first()
    .waitFor({ state: 'visible', timeout: 35000 })
    .catch(async (err) => {
      const urlFinal = page.url();
      throw new Error(
        `clickNew: form fields not visible after 35s.\n` +
        `  URL before click: ${urlBefore}\n` +
        `  URL after 2s:     ${urlAfter2s}\n` +
        `  URL final:        ${urlFinal}\n` +
        `  ${err.message}`
      );
    });
}

async function saveRecord(page) {
  // Odoo 17 auto-save form: the save button has aria-label "Save manually".
  // Use exact matching to avoid catching aria-hidden duplicates.
  const btn = page.getByRole('button', { name: 'Save manually', exact: true });
  if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await btn.click();
    // Wait for the button to disappear (record committed to DB)
    await btn.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }
}

async function discardRecord(page) {
  const btn = page.getByRole('button', { name: /^Discard/i }).first()
    .or(page.locator('.o_control_panel .o_form_button_discard')).first();
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click();
    await page.waitForLoadState('domcontentloaded');
  }
}

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

async function fillChar(page, fieldName, value) {
  // Scope to .o_form_view to avoid matching hidden kanban quick-create inputs.
  let input = page.locator(
    `.o_form_view [name="${fieldName}"] input, .o_form_view input[name="${fieldName}"]`
  ).first();
  // Odoo renders the record title (name='name') inside a heading element
  // without a div[name] wrapper, and may use a contenteditable div (not a
  // real <input>). Fall back to getByRole('textbox') scoped to the heading.
  if (fieldName === 'name') {
    const visible = await input.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) {
      input = page.getByRole('heading', { level: 1 }).getByRole('textbox').first();
    }
  }
  await input.waitFor({ state: 'visible', timeout: 15000 });
  for (let attempt = 0; attempt < 5; attempt++) {
    await input.fill(value, { timeout: 20000 });
    const actual = await input.inputValue().catch(() => null);
    if (actual === value) return;
    await page.locator('.o_form_view').first().waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  }
}

async function fillMany2one(page, fieldName, value) {
  const input = page.locator(`div[name="${fieldName}"] input`).first();
  await input.waitFor({ state: 'visible', timeout: 15000 });

  const dropdown = page.locator(
    '.o_autocomplete_dropdown, .o-autocomplete--dropdown-menu'
  ).first();

  await input.click();
  await dropdown.waitFor({ state: 'visible', timeout: 10000 });
  await input.pressSequentially(value, { delay: 80 });

  const exactOption = dropdown
    .locator('.o_menu_item, li, a')
    .filter({ hasText: value })
    .filter({ hasNotText: /Create|Search More/ })
    .first();

  const found = await exactOption.waitFor({ state: 'visible', timeout: 15000 })
    .then(() => true)
    .catch(() => false);

  if (found) {
    await exactOption.click();
  } else {
    const fallback = dropdown
      .locator('.o_menu_item, li, a')
      .filter({ hasText: value })
      .first();
    const hasFallback = await fallback.waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (!hasFallback) {
      throw new Error(
        `fillMany2one: no option matching "${value}" appeared in "${fieldName}" dropdown. ` +
        `Check that the target model's _rec_name is set to 'x_name' and the record exists.`
      );
    }
    await fallback.click();
  }

  await dropdown.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);

  const actual = await input.inputValue().catch(() => null);
  if (actual !== value) {
    throw new Error(
      `fillMany2one: field "${fieldName}" expected "${value}" after selection but got "${actual}". ` +
      `If the model's _rec_name is 'x_name', upgrading the module on the Odoo instance should fix this.`
    );
  }
}

async function fillMany2oneCreate(page, fieldName, value) {
  const input = page.locator(`div[name="${fieldName}"] input`).first();
  await input.waitFor({ state: 'visible', timeout: 15000 });
  const dropdown = page.locator(
    '.o_autocomplete_dropdown, .o-autocomplete--dropdown-menu'
  ).first();
  await input.click();
  await dropdown.waitFor({ state: 'visible', timeout: 10000 });
  await input.pressSequentially(value, { delay: 80 });
  // Prefer exact existing match; fall back to "Create 'value'" quick-create option
  const exactOption = dropdown
    .locator('.o_menu_item, li, a')
    .filter({ hasText: value })
    .filter({ hasNotText: /Create|Search More/ })
    .first();
  if (await exactOption.isVisible({ timeout: 3000 }).catch(() => false)) {
    await exactOption.click();
  } else {
    const createOption = dropdown
      .locator('.o_menu_item, li, a')
      .filter({ hasText: new RegExp(`Create.*${value}`, 'i') })
      .first();
    await createOption.waitFor({ state: 'visible', timeout: 8000 });
    await createOption.click();
  }
  await dropdown.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function handleCreateDialog(page, fields) {
  // Target only the foreground (active) technical modal — Odoo stacks them
  // with o_inactive_modal on any covered one.
  const modal = page.locator('.o_technical_modal:not(.o_inactive_modal)').first();
  // Wait up to 5s for the dialog to open — it may take a moment after the "Create" click.
  await modal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  if (!(await modal.isVisible().catch(() => false))) return;

  for (const [fieldName, preferredValue] of Object.entries(fields)) {
    // Wait for the field to be rendered before touching it (avoids timing race on dialog open)
    await modal.locator(`[name="${fieldName}"]`).waitFor({ state: 'visible', timeout: 8000 });
    const input = modal.locator(`[name="${fieldName}"] input`).first();
    // Skip if the field is already filled correctly (Odoo may pre-populate from context)
    const existing = await input.inputValue().catch(() => '');
    if (existing && existing.includes(preferredValue)) continue;

    // Odoo renders autocomplete dropdowns at body level, so page.locator is correct here.
    const dropdown = page.locator(
      '.o_autocomplete_dropdown, .o-autocomplete--dropdown-menu'
    ).first();
    await input.click();
    await dropdown.waitFor({ state: 'visible', timeout: 8000 });
    await input.pressSequentially(preferredValue, { delay: 80 });
    await page.waitForTimeout(800);

    const exactOpt = dropdown
      .locator('.o_menu_item, li, a')
      .filter({ hasText: preferredValue })
      .filter({ hasNotText: /Create|Search More/ })
      .first();

    if (await exactOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
      await exactOpt.click();
    } else {
      // Preferred value not found — clear and pick the first available record.
      await input.press('Control+a');
      await input.press('Backspace');
      await page.waitForTimeout(500);
      const firstOpt = dropdown
        .locator('.o_menu_item, li, a')
        .filter({ hasNotText: /Create|Search More/ })
        .first();
      if (await firstOpt.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstOpt.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }
    await dropdown.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
  }

  await modal.getByRole('button', { name: 'Save & Close' }).click();
  await page.waitForTimeout(1000);

  // If a validation error appeared (e.g. duplicate serial), close it and throw.
  const errModal = page.locator('.o_technical_modal:not(.o_inactive_modal)').filter({ hasText: 'Validation Error' }).first();
  if (await errModal.isVisible({ timeout: 1500 }).catch(() => false)) {
    const errText = await errModal.locator('p, .o_error_detail').first().textContent().catch(() => '');
    await errModal.getByRole('button', { name: 'Close' }).click();
    await errModal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    throw new Error(`handleCreateDialog Validation Error: ${errText.trim()}`);
  }

  // If dialog is still open, required fields likely failed inline validation — report and fail.
  await modal.waitFor({ state: 'hidden', timeout: 12000 }).catch(async () => {
    const invalidCount = await modal.locator('.o_field_invalid').count();
    throw new Error(`handleCreateDialog: dialog did not close after Save & Close (${invalidCount} invalid fields)`);
  });
}

async function fillText(page, fieldName, value) {
  const area = page.locator(`div[name="${fieldName}"] textarea`).first();
  await area.waitFor({ state: 'visible' });
  await area.click();
  await area.fill(value);
}

async function setBoolean(page, fieldName, checked) {
  const cb = page.locator(`div[name="${fieldName}"] input[type="checkbox"]`).first();
  await cb.waitFor({ state: 'visible' });
  const current = await cb.isChecked();
  if (current !== checked) {
    await cb.click();
  }
}

async function getFieldText(page, fieldName) {
  const field = page.locator(`div[name="${fieldName}"]`).first();
  await field.waitFor({ state: 'visible' });
  // Odoo 17 always-edit forms render char/many2one fields as inputs.
  // Fall back to textContent for read-only or span-rendered fields.
  const input = field.locator('input').first();
  if (await input.count() > 0) {
    return (await input.inputValue())?.trim() ?? '';
  }
  return (await field.textContent())?.trim() ?? '';
}

async function getBooleanValue(page, fieldName) {
  const cb = page.locator(`div[name="${fieldName}"] input[type="checkbox"]`).first();
  return cb.isChecked();
}

// ---------------------------------------------------------------------------
// Notebook / tabs
// ---------------------------------------------------------------------------

async function clickTab(page, tabLabel) {
  const tab = page
    .locator('.o_notebook .nav-link, .o_notebook .o_page_direct_link')
    .filter({ hasText: tabLabel })
    .first();
  await tab.waitFor({ state: 'visible', timeout: 8000 });
  await tab.click();
  await page.waitForLoadState('domcontentloaded');
}

async function expectTabVisible(page, tabLabel) {
  const tab = page
    .locator('.o_notebook .nav-link, .o_notebook .o_page_direct_link')
    .filter({ hasText: tabLabel })
    .first();
  await tab.waitFor({ state: 'visible', timeout: 8000 });
}

async function expectTabHidden(page, tabLabel) {
  const tab = page
    .locator('.o_notebook .nav-link, .o_notebook .o_page_direct_link')
    .filter({ hasText: tabLabel })
    .first();
  await tab.waitFor({ state: 'hidden', timeout: 8000 });
}

// ---------------------------------------------------------------------------
// Header buttons (statusbar area)
// ---------------------------------------------------------------------------

async function clickHeaderButton(page, label) {
  const btn = page
    .locator('.o_statusbar_buttons button, .o_form_statusbar button, .o_cp_buttons button')
    .filter({ hasText: label })
    .first();
  await btn.waitFor({ state: 'visible', timeout: 10000 });
  await btn.click();
}

async function expectHeaderButtonVisible(page, label) {
  const btn = page
    .locator('.o_statusbar_buttons button, .o_form_statusbar button')
    .filter({ hasText: label })
    .first();
  await btn.waitFor({ state: 'visible', timeout: 8000 });
}

async function expectHeaderButtonHidden(page, label) {
  const btn = page
    .locator('.o_statusbar_buttons button, .o_form_statusbar button')
    .filter({ hasText: label })
    .first();
  await btn.waitFor({ state: 'hidden', timeout: 8000 });
}

// ---------------------------------------------------------------------------
// Dialogs
// ---------------------------------------------------------------------------

async function confirmDialog(page, buttonText = 'OK') {
  const dialog = page.locator('.o_dialog, .modal').first();
  await dialog.waitFor({ state: 'visible', timeout: 8000 });
  const btn = dialog.locator('button').filter({ hasText: buttonText }).first();
  await btn.waitFor({ state: 'visible' });
  await btn.click();
  await dialog.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
}

async function cancelDialog(page) {
  const dialog = page.locator('.o_dialog, .modal').first();
  await dialog.waitFor({ state: 'visible', timeout: 5000 });
  const btn = dialog.locator('button').filter({ hasText: /Cancel|Discard/ }).first();
  await btn.click();
  await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Stage / statusbar
// ---------------------------------------------------------------------------

async function getCurrentStageName(page) {
  const active = page
    .locator('.o_statusbar_status button.o_arrow_button_current, .o_statusbar_status button[aria-checked="true"]')
    .first();
  return (await active.textContent())?.trim() ?? '';
}

async function expectActiveStage(page, stageName) {
  const { expect } = require('@playwright/test');
  const active = page
    .locator('.o_statusbar_status button.o_arrow_button_current, .o_statusbar_status button[aria-checked="true"]')
    .first();
  await active.waitFor({ state: 'visible', timeout: 10000 });
  await expect(active).toContainText(stageName);
}

async function expectStageButtonCount(page, count) {
  const { expect } = require('@playwright/test');
  const buttons = page.locator('.o_statusbar_status button');
  await expect(buttons).toHaveCount(count);
}

// ---------------------------------------------------------------------------
// Archive / action menu
// ---------------------------------------------------------------------------

async function archiveRecord(page) {
  // Ensure record is saved before attempting archive (unsaved records hide the menu)
  await saveRecord(page);

  // Odoo 17 form: action menu is an anonymous icon button in the breadcrumb
  // area. Try multiple selectors in order of specificity.
  const cog = page.locator(
    '.o_cp_action_menus .o_dropdown_toggler,' +
    '.o_control_panel .o_cog_menu_toggler,' +
    'button[aria-label="Action"],' +
    '.o_control_panel button:has(.fa-cog),' +
    '.o_control_panel button:has(i.fa)'
  ).first();
  await cog.waitFor({ state: 'visible', timeout: 8000 });
  await cog.click();
  const archiveItem = page
    .locator('.o_dropdown_item, .o_menu_item')
    .filter({ hasText: 'Archive' })
    .first();
  await archiveItem.waitFor({ state: 'visible', timeout: 5000 });
  await archiveItem.click();
  await confirmDialog(page, 'OK').catch(() => {});
  await page.waitForLoadState('domcontentloaded');
}

// ---------------------------------------------------------------------------
// Inline tree (one2many editable)
// ---------------------------------------------------------------------------

async function addDiagnosisLine(page, { diagArea, diagCode, reason, subReason, resolution, repairStage }) {
  // Click "Add a line" in the diagnosis tree
  const addLine = page
    .locator('.o_notebook .o_field_one2many .o_list_footer .btn, .o_notebook .o_field_one2many .o_add_record')
    .filter({ hasText: 'Add a line' })
    .first();
  await addLine.waitFor({ state: 'visible', timeout: 8000 });
  await addLine.click();

  // The row becomes editable — fill each column
  const lastRow = page.locator('.o_field_one2many .o_data_row').last();

  const fillCell = async (fieldName, value) => {
    const cell = lastRow.locator(`td[name="${fieldName}"] input, td[name="${fieldName}"] .o_field_widget input`).first();
    await cell.click();
    await cell.fill(value);
    const dropdown = page.locator('.o_autocomplete_dropdown').first();
    if (await dropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
      const opt = dropdown.locator('.o_menu_item').filter({ hasText: value }).first();
      if (await opt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await opt.click();
      }
    }
  };

  if (diagArea)    await fillCell('x_studio_diagnosis_area', diagArea);
  if (diagCode)    await fillCell('x_studio_diagnosis_code', diagCode);
  if (reason)      await fillCell('x_studio_reason', reason);
  if (subReason)   await fillCell('x_studio_sub_reason', subReason);
  if (resolution)  await fillCell('x_studio_resolution', resolution);
  if (repairStage) await fillCell('x_studio_repair_stage', repairStage);
}

// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------

async function waitForSuccessNotification(page) {
  await page
    .locator('.o_notification.bg-success, .o_notification_manager .text-success, .o_notification')
    .first()
    .waitFor({ state: 'visible', timeout: 10000 })
    .catch(() => {});
}

module.exports = {
  login,
  goToApp,
  goToHelpdesk,
  clickMenuPath,
  clickNew,
  saveRecord,
  discardRecord,
  fillChar,
  fillMany2one,
  fillMany2oneCreate,
  handleCreateDialog,
  fillText,
  setBoolean,
  getFieldText,
  getBooleanValue,
  clickTab,
  expectTabVisible,
  expectTabHidden,
  clickHeaderButton,
  expectHeaderButtonVisible,
  expectHeaderButtonHidden,
  confirmDialog,
  cancelDialog,
  getCurrentStageName,
  expectActiveStage,
  expectStageButtonCount,
  archiveRecord,
  addDiagnosisLine,
  waitForSuccessNotification,
};
