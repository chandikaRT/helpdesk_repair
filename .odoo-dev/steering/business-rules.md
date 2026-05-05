# Business Rules — Helpdesk Repair Module

## 1. Module Identity

- **Technical name**: `helpdesk_repair`
- **Replaces**: `studio_customization` prefix on all XML IDs
- **Primary record**: `helpdesk.ticket` (extended, not replaced)
- **Sequence format**: `REPAIR/YYYY/NNNNN` (inherits helpdesk numbering)
- **Odoo version**: 17.0
- **Dependencies**: `helpdesk`, `helpdesk_fsm`, `helpdesk_sale`, `helpdesk_stock`, `repair`, `sale`, `stock`, `project`, `account`

---

## 2. Custom Models (Master Data)

All custom models use `x_` prefix (_name) and inherit `mail.thread` + `mail.activity.mixin`.

| Model (_name) | String | Mail Thread | Mail Activity |
|---|---|---|---|
| `x_repair_stages` | Repair Stages | True | True |
| `x_repair_reason` | Repair Reason | True | True |
| `x_repair_reason_custom` | Repair Reason - Customer | True | True |
| `x_repair_sub_reason` | Repair Sub Reason | True | True |
| `x_repair_accounts` | Repair Accounts | True | True |
| `x_diagnosis_areas` | Diagnosis Areas | True | True |
| `x_diagnosis_codes` | Diagnosis Codes | True | True |
| `x_symptom_areas` | Symptom Areas | True | True |
| `x_symptom_codes` | Symptom Codes | True | True |
| `x_task_diagnosis` | Task Diagnosis | True | True |
| `x_conditions` | Conditions | True | True |
| `x_resolutions` | Resolutions | True | True |

---

## 3. Fields per Custom Model

### `x_repair_stages` — Repair Stages
| Field name | Type | Attributes |
|---|---|---|
| `x_name` | Char | required=True, string="Name" |
| `x_active` | Boolean | default=True, tracking=1 |
| `x_studio_sequence` | Integer | string="Sequence" |
| `x_studio_description` | Text | string="Description" |
| `x_studio_company_id` | Many2one → `res.company` | string="Company", ondelete='set null' |

### `x_repair_reason` — Repair Reason
| Field name | Type | Attributes |
|---|---|---|
| `x_name` | Char | required=True |
| `x_active` | Boolean | default=True, tracking=1 |
| `x_color` | Integer | string="Color Index" |
| `x_studio_sequence` | Integer | string="Sequence" |
| `x_studio_company_id` | Many2one → `res.company` | ondelete='set null' |

### `x_repair_reason_custom` — Repair Reason - Customer
| Field name | Type | Attributes |
|---|---|---|
| `x_name` | Char | required=True |
| `x_active` | Boolean | default=True, tracking=1 |
| `x_color` | Integer | string="Color Index" |
| `x_studio_sequence` | Integer | string="Sequence" |
| `x_studio_company_id` | Many2one → `res.company` | ondelete='set null' |

### `x_repair_sub_reason` — Repair Sub Reason
| Field name | Type | Attributes |
|---|---|---|
| `x_name` | Char | required=True |
| `x_active` | Boolean | default=True, tracking=1 |
| `x_studio_sequence` | Integer | string="Sequence" |
| `x_studio_reason_code` | Many2one → `x_repair_reason` | string="Reason Code", ondelete='set null' |
| `x_studio_company_id` | Many2one → `res.company` | ondelete='set null' |

### `x_repair_accounts` — Repair Accounts
| Field name | Type | Attributes |
|---|---|---|
| `x_name` | Char | required=True |
| `x_active` | Boolean | default=True, tracking=1 |
| `x_studio_sequence` | Integer | string="Sequence" |
| `x_studio_rug_account` | Many2one → `account.account` | string="RUG Account", ondelete='set null' |
| `x_studio_company_id` | Many2one → `res.company` | ondelete='set null' |

### `x_diagnosis_areas` — Diagnosis Areas
| Field name | Type | Attributes |
|---|---|---|
| `x_name` | Char | required=True |
| `x_active` | Boolean | default=True, tracking=1 |
| `x_studio_sequence` | Integer | string="Sequence" |
| `x_studio_description` | Text | string="Description" |
| `x_studio_company_id` | Many2one → `res.company` | ondelete='set null' |

### `x_diagnosis_codes` — Diagnosis Codes
| Field name | Type | Attributes |
|---|---|---|
| `x_name` | Char | required=True |
| `x_active` | Boolean | default=True, tracking=1 |
| `x_studio_sequence` | Integer | string="Sequence" |
| `x_studio_description` | Text | string="Description" |
| `x_studio_diagnosis_area_1` | Many2one → `x_diagnosis_areas` | string="Diagnosis Area", ondelete='set null' |
| `x_studio_company_id` | Many2one → `res.company` | ondelete='set null' |

### `x_symptom_areas` — Symptom Areas
| Field name | Type | Attributes |
|---|---|---|
| `x_name` | Char | required=True |
| `x_active` | Boolean | default=True, tracking=1 |
| `x_studio_sequence` | Integer | string="Sequence" |
| `x_studio_description` | Text | string="Description" |
| `x_studio_company_id` | Many2one → `res.company` | ondelete='set null' |

### `x_symptom_codes` — Symptom Codes
| Field name | Type | Attributes |
|---|---|---|
| `x_name` | Char | required=True |
| `x_active` | Boolean | default=True, tracking=1 |
| `x_studio_sequence` | Integer | string="Sequence" |
| `x_studio_description` | Text | string="Description" |
| `x_studio_symptom_area` | Many2one → `x_symptom_areas` | string="Symptom Area", ondelete='set null' |
| `x_studio_company_id` | Many2one → `res.company` | ondelete='set null' |

### `x_conditions` — Conditions
| Field name | Type | Attributes |
|---|---|---|
| `x_name` | Char | required=True |
| `x_active` | Boolean | default=True, tracking=1 |
| `x_studio_sequence` | Integer | string="Sequence" |
| `x_studio_description` | Text | string="Description" |
| `x_studio_company_id` | Many2one → `res.company` | ondelete='set null' |

### `x_resolutions` — Resolutions
| Field name | Type | Attributes |
|---|---|---|
| `x_name` | Char | required=True |
| `x_active` | Boolean | default=True, tracking=1 |
| `x_studio_sequence` | Integer | string="Sequence" |
| `x_studio_description` | Text | string="Description" |
| `x_studio_company_id` | Many2one → `res.company` | ondelete='set null' |

### `x_task_diagnosis` — Task Diagnosis (line items on project.task)
| Field name | Type | Attributes |
|---|---|---|
| `x_name` | Char | required=True |
| `x_active` | Boolean | default=True, tracking=1 |
| `x_studio_sequence` | Integer | string="Sequence", handle widget in tree view |
| `x_studio_description` | Text | string="Description" |
| `x_studio_condition` | Many2one → `x_conditions` | ondelete='set null' |
| `x_studio_diagnosis_area` | Many2one → `x_diagnosis_areas` | required in tree, ondelete='set null' |
| `x_studio_diagnosis_code` | Many2one → `x_diagnosis_codes` | required in tree, ondelete='set null'; domain: `[["x_studio_diagnosis_area_1","=",x_studio_diagnosis_area]]` |
| `x_studio_reason` | Many2one → `x_repair_reason` | required in tree, ondelete='set null' |
| `x_studio_sub_reason` | Many2one → `x_repair_sub_reason` | required in tree, ondelete='set null'; domain: `[["x_studio_reason_code","=",x_studio_reason]]` |
| `x_studio_resolution` | Many2one → `x_resolutions` | required in tree, ondelete='set null' |
| `x_studio_repair_stage` | Many2one → `x_repair_stages` | required in tree, ondelete='set null' |
| `x_studio_task_id` | Many2one → `project.task` | string="Task Id", ondelete='set null' (inverse field for one2many) |
| `x_studio_symptom_area` | Many2one → `x_symptom_areas` | ondelete='set null' |
| `x_studio_symptom_code` | Many2one → `x_symptom_codes` | ondelete='set null' |
| `x_studio_company_id` | Many2one → `res.company` | ondelete='set null' |

---

## 4. Extended Fields on `helpdesk.ticket`

### Visible fields — left column, AFTER `user_id`
| Field name | Type | Display attributes |
|---|---|---|
| `ticket_type_id` | Many2one (existing, moved) | force_save=True, readonly when `x_studio_rug_approved == True`, required when `user_id` set |
| `x_studio_return_receipt_location` | Many2one → `stock.location` | string="Return Receipt", options={'no_create': True} |
| `x_studio_repair_location` | Many2one → `stock.location` | string="Repair Location", invisible when `domain_user_ids == [146]` |
| `x_studio_job_location` | Char | string="Job Location" (known value: "Factory Repair") |

### Visible fields — AFTER `priority`
| Field name | Type | Display attributes |
|---|---|---|
| `x_studio_re_estimate_status` | Char (computed) | string="Re-estimate Status", readonly |
| `x_studio_re_estimate_count` | Integer/Float (computed) | widget="many2one_reference", options={'enable_formatting': false}, readonly |

### Visible fields — AFTER `partner_id`
| Field name | Type | Display attributes |
|---|---|---|
| `partner_name` | Char (existing) | — |
| `partner_email` | Char (existing) | string="Email" |

### Visible fields — right column, AFTER `email_cc`
| Field name | Type | Display attributes |
|---|---|---|
| `x_studio_serial_no` | Many2one → `stock.lot` | string="Serial Number" |
| `product_id` | Many2one (existing) | — |
| `x_studio_tracking` | Char | string="Tracking" |
| `x_studio_source_location` | Many2one → `stock.location` | string="Source Location" |
| `x_studio_quick_repair_status` | Char | string="Quick Repair Status" |

### Visible fields — right column, AFTER second `sale_order_id`
| Field name | Type | Display attributes |
|---|---|---|
| `x_studio_rug_approved` | Boolean | invisible=True (modifier only) |
| `x_studio_rug_request_sent` | Boolean | string="RUG Request Sent" |
| `x_studio_repair_serial_created` | Boolean | string="Repair Serial Created" |

### Modifier-only fields (invisible, added to `//form[1]`)
These fields are declared invisible and used only for view condition expressions:
`x_studio_cancelled`, `x_studio_cancelled_2`, `x_studio_estimation_approved_stage_updated`, `x_studio_fsm_task_done`, `x_studio_normal_repair_with_serial_no`, `x_studio_normal_repair_without_serial_no`, `x_studio_receive_at_centre`, `x_studio_receive_at_factory`, `x_studio_repair_reason` (many2many), `x_studio_rug_repair`, `x_studio_send_to_centre`, `x_studio_send_to_factory`, `x_studio_sn_updated`, `x_studio_task_status`, `x_studio_valid_confirm_return`, `x_studio_valid_return`, `fsm_task_count` (existing), `use_product_returns` (existing)

### All additional fields declared on `helpdesk.ticket`
| Field name | Type | Notes |
|---|---|---|
| `x_studio_cancel_reason` | Text | string="Cancel Reason" |
| `x_studio_cancelled_by` | Many2one → `res.users` | string="Cancelled By" |
| `x_studio_cancelled_date` | Datetime | string="Cancelled Date" |
| `x_studio_reopened_by` | Many2one → `res.users` | string="Reopened By" |
| `x_studio_reopened_date` | Datetime | string="Reopened Date" |
| `x_studio_rug_confirmed` | Boolean | related=`ticket_type_id.x_studio_rug_confirmed`, readonly |
| `x_studio_rug_repair` | Boolean | related=`ticket_type_id.x_studio_rug`, readonly |
| `x_studio_warranty_card` | Binary | string="Warranty Card" |
| `x_studio_related_information` | Binary | string="Related Information" |
| `x_studio_cancelled_stage_id` | Many2one → `helpdesk.stage` | ondelete='set null' |
| `x_studio_repair_reason` | Many2many → `x_repair_reason` | relation table: `x_helpdesk_ticket_x_repair_reason_custom_rel` |
| `x_studio_serial_number` | Many2one → `stock.lot` | ondelete='set null' |
| `x_studio_receive_at_factory` | Boolean | — |
| `x_studio_receive_at_centre` | Boolean | — |
| `x_studio_send_to_factory` | Boolean | — |
| `x_studio_send_to_centre` | Boolean | — |
| `x_studio_cancelled` | Boolean | — |
| `x_studio_cancelled_2` | Boolean | — |
| `x_studio_sn_updated` | Boolean | — |
| `x_studio_estimation_approved_stage_updated` | Boolean | — |
| `x_studio_invoice_stage_updated` | Boolean | — |
| `x_studio_repair_started_stage_updated` | Boolean | — |
| `x_studio_valid_return` | Boolean | — |
| `x_studio_valid_confirm_return` | Boolean | — |
| `x_studio_task_status` | Boolean | computed, readonly |
| `x_studio_fsm_task_done` | Boolean | computed, readonly |
| `x_studio_handed_over` | Boolean | computed, readonly |
| `x_studio_valid_confirmed_so` | Boolean | computed, readonly |
| `x_studio_valid_confirmed2_so` | Boolean | computed, readonly |
| `x_studio_valid_delivered_so` | Boolean | computed, readonly |
| `x_studio_valid_invoiced_so` | Boolean | computed, readonly |
| `x_studio_fully_paid_so` | Boolean | computed, readonly |
| `x_studio_rug_approved` | Boolean | — |
| `x_studio_user_location_validation` | Boolean | computed, readonly |
| `x_studio_normal_repair_with_serial_no` | Boolean | — |
| `x_studio_normal_repair_without_serial_no` | Boolean | — |
| `x_studio_re_estimate_status` | Char | computed; values: "None", "Re-estimated" |
| `x_studio_re_estimate_count` | Integer/Float | computed, depends on fsm_task_ids |
| `x_studio_rug_approval_status` | Char | computed; values: "RUG Approved", "RUG Rejected" |
| `x_studio_pick_id` | Many2one → `stock.picking` | used in button context |
| `x_studio_virtual_location_id` | Many2one → `stock.location` | used in button context |
| `x_x_studio_created_from_help_ticket_stock_picking_count` | Integer | computed |

---

## 5. Extended Fields on `helpdesk.ticket.type`

| Field name | Type | Attributes |
|---|---|---|
| `x_studio_rug` | Boolean | string="Repair Under Warranty (RUG)" |
| `x_studio_rug_confirmed` | Boolean | string="RUG Confirmed" |
| `x_studio_with_serial_no` | Boolean | string="With Serial No" |
| `x_studio_without_serial_no` | Boolean | string="Without Serial No" |

---

## 6. Extended Fields on `project.task`

| Field name | Type | Attributes |
|---|---|---|
| `x_studio_created_date` | Datetime | string="Created Date" |
| `x_studio_repair_reason` | Many2many → `x_repair_reason` | relation table: `x_project_task_x_repair_reason_rel` |
| `x_studio_priority` | Integer | string="Priority" |
| `x_studio_quotation_type` | Selection | string="Quotation Type"; options include 'Repair', 'Project' |
| `x_studio_material_availability` | Char | string="Material Availability" |
| `x_studio_repair_image_01` | Binary | string="Repair Image 01" |
| `x_studio_repair_image_02` | Binary | string="Repair Image 02" |
| `x_studio_warranty_card` | Binary | related → `helpdesk_ticket_id.x_studio_warranty_card`, readonly |
| `x_studio_related_information` | Binary | related → `helpdesk_ticket_id.x_studio_related_information`, readonly |
| `x_studio_diagnosis_ids` | One2many → `x_task_diagnosis` | inverse_name=`x_studio_task_id` |
| `x_studio_cancelled` | Boolean | — |
| `x_studio_end_quick_repair` | Boolean | — |
| `x_studio_valid_diagnosis` | Boolean | computed |
| `x_studio_diagnosis_area_1` | Many2one → `x_diagnosis_areas` | invisible modifier only |
| `x_studio_reason_code` | Many2one → `x_repair_reason` | invisible modifier only |

---

## 7. Extended Fields on `sale.order`

| Field name | Type | Attributes |
|---|---|---|
| `x_studio_repair_reason` | Many2many → `x_repair_reason` | related: `task_id.x_studio_repair_reason`, readonly; relation table: `x_sale_order_x_repair_reason_rel` |
| `x_studio_rug_approved` | Boolean | — |
| `x_studio_rug_rejected` | Boolean | — |
| `x_studio_rug_request_sent` | Boolean | — |
| `x_studio_rug_confirmed` | Boolean | related → `task_id.helpdesk_ticket_id.x_studio_rug_confirmed`, readonly |
| `x_studio_re_estimate_count` | Integer | — |
| `x_studio_re_estimate_request_count` | Integer | — |
| `x_studio_re_estimate_request_count_1` | Integer | — |
| `x_studio_re_estimate_request_sent` | Boolean | — |
| `x_studio_warranty_card` | Binary | related: `task_id.x_studio_warranty_card`, readonly |

---

## 8. Extended Fields on `stock.picking`

| Field name | Type | Attributes |
|---|---|---|
| `x_studio_helpdesk_ticket_id` | Many2one → `helpdesk.ticket` | string="Helpdesk Ticket Id" |
| `x_studio_created_from_help_ticket` | Many2one → `helpdesk.ticket` | readonly, related |
| `x_studio_factory_repair` | Boolean | computed, readonly; string="Factory Repair" |
| `x_studio_valid_factory_repair` | Boolean | computed, readonly |
| `x_studio_received_at_centre` | Boolean | computed, readonly |
| `x_studio_task_status` | Boolean | computed, readonly |
| `x_studio_fsm_task_done` | Boolean | computed, readonly |
| `x_studio_fully_paid_so` | Boolean | — |
| `x_studio_cancelled` | Boolean | — |
| `x_studio_validation` | Boolean | computed, readonly; visible under factory repair conditions |

---

## 9. Workflow Stages (helpdesk.stage)

The repair ticket statusbar shows these stages in order. `stage_id` is **not clickable** (`options={'clickable': False}`):

| # | Stage name | Notes |
|---|---|---|
| 1 | NEW | Initial stage |
| 2 | SENT TO FACTORY | Factory Repair only |
| 3 | RECEIVED AT FACTORY | Factory Repair only |
| 4 | DIAGNOSIS | — |
| 5 | ESTIMATION SENT | — |
| 6 | ESTIMATION APPROVAL RECEIVED | — |
| 7 | ADVANCE RECEIVED | — |
| 8 | REPAIR STARTED | — |
| 9 | REPAIR COMPLETED | — |
| 10 | SENT TO SALES CENTRE | Factory Repair only |
| 11 | RECEIVED AT SALES CENTRE | Factory Repair only |
| 12 | HANDED OVER TO CUSTOMER | — |
| 13 | CANCELLED | — |

---

## 10. Repair Type Classification

There are four ticket types, each a specific combination of the four boolean flags on `helpdesk.ticket.type`.
The related fields on `helpdesk.ticket` mirror these flags for use in view conditions.

| Ticket Type Name | `x_studio_rug` | `x_studio_rug_confirmed` | `x_studio_with_serial_no` | `x_studio_without_serial_no` |
|---|---|---|---|---|
| Repair - Under Warranty - RUG | ✓ | ✓ | — | — |
| Repair - Under Warranty - External not RUG | ✓ | — | — | — |
| Repair - Not Under Warranty (With Serial No) | — | — | ✓ | — |
| Repair - Not Under Warranty (Without Serial No) | — | — | — | ✓ |

**Related proxy fields on `helpdesk.ticket`** (readonly, used in view conditions):
| Proxy field | Source |
|---|---|
| `x_studio_rug_repair` | `ticket_type_id.x_studio_rug` |
| `x_studio_rug_confirmed` | `ticket_type_id.x_studio_rug_confirmed` |
| `x_studio_normal_repair_with_serial_no` | `ticket_type_id.x_studio_with_serial_no` |
| `x_studio_normal_repair_without_serial_no` | `ticket_type_id.x_studio_without_serial_no` |

---

## 11. Workflow Action Buttons on `helpdesk.ticket`

All buttons are context-sensitive. Order as displayed in the form header:

| Label | Internal Action Ref | Confirm dialog | Key Visibility Rule |
|---|---|---|---|
| Change Repair Type To RUG | `action_change_type_to_rug` | Yes | Only when `normal_repair_with_serial_no` and `valid_return` and not cancelled/estimation-approved |
| Update Serial | `action_update_serial` | No | When serial_no set, not yet updated, not without-serial |
| Return | `stock.act_stock_return_picking` | No | RUG repairs only, after serial updated and return not yet done |
| Receipt (for without-serial) | Server action | No | Without-serial type, after serial created |
| Receipt (for with-serial RUG) | Server action | No | With-serial RUG, after SN updated |
| Create Repair Route | `action_create_repair_route` | Yes | Without-serial, tracking='none' |
| Create Repair Serial | `action_create_repair_serial` | Yes | Without-serial, tracking='serial' |
| Send to Factory | `action_send_to_factory` | No | job_location='Factory Repair', not yet sent, not cancelled |
| Receive at Factory | `action_receive_at_factory` | No | After sent to factory, not yet received |
| Send to Sales Centre | `action_send_to_sales_centre` | No | After received at factory and FSM task done |
| Receive at Sales Centre | `action_receive_at_sales_centre` | No | After sent to centre, not yet received |
| Cancel | `action_cancel_repair` | Yes | Stages 1–2 and 4–6 (not stages 3,4,7,8,9,10,11,12,13) |
| Cancel (stage 10) | `action_cancel_repair_stage10` | Yes | Only in stage 10 |
| Reopen | `action_reopen_repair` | Yes | Only when `x_studio_cancelled == True` |

---

## 12. Diagnosis Validation Rules (on `project.task`)

| Button | Shown when |
|---|---|
| View Repair Diagnosis Validation | `valid_diagnosis == False` AND `helpdesk_ticket_id` set AND not cancelled AND not end_quick_repair |
| View Repair Image Validation | `repair_image_01 == False` AND `helpdesk_ticket_id` set AND not cancelled AND not end_quick_repair |
| Tested OK | `helpdesk_ticket_id` set AND not cancelled AND not end_quick_repair AND `material_line_product_count == 0` |

---

## 13. Key Computed Field Logic (from Studio automation code)

### `x_studio_re_estimate_status` on `helpdesk.ticket`
```
val = 'None'
for task in self.fsm_task_ids:
    if task.sale_order_id.x_studio_re_estimate_count > 0:
        val = 'Re-estimated'
self.x_studio_re_estimate_status = val
```

### `x_studio_rug_approval_status` on `helpdesk.ticket`
```
val = ''
for task in self.fsm_task_ids:
    so = sale.order.search([('task_id','=',task.id)], limit=1)
    if so.x_studio_rug_approved:
        val = 'RUG Approved'
    elif so.x_studio_rug_rejected:
        val = 'RUG Rejected'
self.x_studio_rug_approval_status = val
```

### `x_studio_factory_repair` on `stock.picking`
```
value = False
value2 = False
if self.x_studio_created_from_help_ticket:
    if self.x_studio_created_from_help_ticket.x_studio_receive_at_factory:
        value = True
    if self.x_studio_created_from_help_ticket.x_studio_job_location == 'Factory Repair':
        value2 = True
elif self.x_studio_helpdesk_ticket_id:
    if self.x_studio_helpdesk_ticket_id.x_studio_receive_at_factory:
        value = True
    if self.x_studio_helpdesk_ticket_id.x_studio_job_location == 'Factory Repair':
        value2 = True
self.x_studio_factory_repair = value
```
