# Technical Stack — Helpdesk Repair Module

## 1. Module File Structure

```
helpdesk_repair/
├── __manifest__.py
├── __init__.py
├── models/
│   ├── __init__.py
│   ├── repair_stages.py            # x_repair_stages
│   ├── repair_reason.py            # x_repair_reason
│   ├── repair_reason_custom.py     # x_repair_reason_custom
│   ├── repair_sub_reason.py        # x_repair_sub_reason
│   ├── repair_accounts.py          # x_repair_accounts
│   ├── diagnosis_areas.py          # x_diagnosis_areas
│   ├── diagnosis_codes.py          # x_diagnosis_codes
│   ├── symptom_areas.py            # x_symptom_areas
│   ├── symptom_codes.py            # x_symptom_codes
│   ├── conditions.py               # x_conditions
│   ├── resolutions.py              # x_resolutions
│   ├── task_diagnosis.py           # x_task_diagnosis
│   ├── helpdesk_ticket.py          # extends helpdesk.ticket
│   ├── helpdesk_ticket_type.py     # extends helpdesk.ticket.type
│   ├── project_task.py             # extends project.task
│   ├── sale_order.py               # extends sale.order
│   └── stock_picking.py            # extends stock.picking
├── views/
│   ├── repair_stages_views.xml
│   ├── repair_reason_views.xml
│   ├── repair_reason_custom_views.xml
│   ├── repair_sub_reason_views.xml
│   ├── repair_accounts_views.xml
│   ├── diagnosis_areas_views.xml
│   ├── diagnosis_codes_views.xml
│   ├── symptom_areas_views.xml
│   ├── symptom_codes_views.xml
│   ├── conditions_views.xml
│   ├── resolutions_views.xml
│   ├── task_diagnosis_views.xml
│   ├── helpdesk_ticket_form.xml
│   ├── helpdesk_ticket_tree.xml
│   ├── helpdesk_ticket_kanban.xml
│   ├── project_task_form.xml
│   └── menus.xml
├── security/
│   ├── ir.model.access.csv
│   └── res_groups.xml
└── data/
    └── helpdesk_stages.xml         # (optional) stage seed data
```

## 2. `__manifest__.py`

```python
{
    'name': 'Helpdesk Repair',
    'version': '17.0.1.0.0',
    'category': 'Helpdesk',
    'author': 'Jinasena Pvt Ltd',
    'depends': [
        'helpdesk',
        'helpdesk_fsm',
        'helpdesk_sale',
        'helpdesk_stock',
        'repair',
        'sale',
        'project',
        'account',
        'stock',
    ],
    'data': [
        'security/res_groups.xml',
        'security/ir.model.access.csv',
        'views/repair_stages_views.xml',
        'views/repair_reason_views.xml',
        'views/repair_reason_custom_views.xml',
        'views/repair_sub_reason_views.xml',
        'views/repair_accounts_views.xml',
        'views/diagnosis_areas_views.xml',
        'views/diagnosis_codes_views.xml',
        'views/symptom_areas_views.xml',
        'views/symptom_codes_views.xml',
        'views/conditions_views.xml',
        'views/resolutions_views.xml',
        'views/task_diagnosis_views.xml',
        'views/helpdesk_ticket_form.xml',
        'views/helpdesk_ticket_tree.xml',
        'views/helpdesk_ticket_kanban.xml',
        'views/project_task_form.xml',
        'views/menus.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}
```

## 3. Naming Conventions

| Element | Convention | Example |
|---|---|---|
| New model `_name` | `x_` prefix (matches Studio) | `x_repair_stages` |
| New model fields | `x_` or `x_studio_` prefix | `x_name`, `x_studio_sequence` |
| Extension fields on existing models | `x_studio_` prefix | `x_studio_return_receipt_location` |
| Python class name | PascalCase without prefix | `RepairStages`, `HelpdeskTicket` |
| View XML IDs | `view_{model_snake}_{type}` | `view_x_repair_stages_form` |
| Action XML IDs | `action_{model_snake}` or `action_{verb}` | `action_x_repair_stages`, `action_send_to_factory` |
| Menu XML IDs | `menu_{location}_{name}` | `menu_repair_stages`, `menu_helpdesk_repair_diagnosis` |

## 4. Python Model Patterns

### New model (master data)
```python
from odoo import fields, models

class RepairStages(models.Model):
    _name = 'x_repair_stages'
    _description = 'Repair Stages'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'x_studio_sequence, id'

    x_name = fields.Char(string='Name', required=True)
    x_active = fields.Boolean(default=True, tracking=1)
    x_studio_sequence = fields.Integer(string='Sequence')
    x_studio_description = fields.Text(string='Description')
    x_studio_company_id = fields.Many2one('res.company', string='Company', ondelete='set null')
```

### Extension model
```python
from odoo import fields, models

class HelpdeskTicket(models.Model):
    _inherit = 'helpdesk.ticket'

    x_studio_return_receipt_location = fields.Many2one(
        'stock.location', string='Return Receipt', ondelete='set null')
    x_studio_repair_location = fields.Many2one(
        'stock.location', string='Repair Location', ondelete='set null')
    x_studio_job_location = fields.Char(string='Job Location')
    x_studio_cancelled = fields.Boolean()
    x_studio_rug_repair = fields.Boolean(
        related='ticket_type_id.x_studio_rug', readonly=True)
    x_studio_rug_confirmed = fields.Boolean(
        related='ticket_type_id.x_studio_rug_confirmed', readonly=True)
    x_studio_normal_repair_with_serial_no = fields.Boolean(
        related='ticket_type_id.x_studio_with_serial_no', readonly=True)
    x_studio_normal_repair_without_serial_no = fields.Boolean(
        related='ticket_type_id.x_studio_without_serial_no', readonly=True)
```

### Computed field with store
```python
x_studio_re_estimate_status = fields.Char(
    compute='_compute_re_estimate_status',
    string='Re-estimate Status',
    store=True,
)

@api.depends('fsm_task_ids')
def _compute_re_estimate_status(self):
    for rec in self:
        val = 'None'
        for task in rec.fsm_task_ids:
            if task.sale_order_id.x_studio_re_estimate_count > 0:
                val = 'Re-estimated'
        rec.x_studio_re_estimate_status = val
```

### Many2many with explicit relation table
```python
x_studio_repair_reason = fields.Many2many(
    'x_repair_reason',
    'x_helpdesk_ticket_x_repair_reason_custom_rel',
    string='Repair Reason',
)
```

### One2many (diagnosis lines)
```python
# On project.task:
x_studio_diagnosis_ids = fields.One2many(
    'x_task_diagnosis', 'x_studio_task_id', string='Diagnosis')

# On x_task_diagnosis:
x_studio_task_id = fields.Many2one(
    'project.task', string='Task Id', ondelete='set null')
```

## 5. Odoo 17 XML View Patterns

### Visibility syntax (Odoo 17 — NOT attrs)
```xml
<!-- CORRECT for Odoo 17 -->
<field name="x_studio_repair_location" invisible="domain_user_ids == [146]"/>
<button string="Send to Factory" invisible="x_studio_job_location != 'Factory Repair'"/>

<!-- WRONG — do not use attrs in Odoo 17 -->
<!-- <field name="x_field" attrs="{'invisible': [('condition','=',True)]}"/> -->
```

### position="attributes" for modifying existing view attributes
```xml
<xpath expr="//field[@name='stage_id']" position="attributes">
    <attribute name="options">{'clickable': False}</attribute>
</xpath>

<xpath expr="//button[@name='action_generate_fsm_task']" position="attributes">
    <attribute name="invisible">...</attribute>
</xpath>
```

### Editable tree with handle
```xml
<tree editable="bottom">
    <field name="x_studio_sequence" widget="handle"/>
    <field name="x_name" column_invisible="True"/>
    <field name="x_studio_diagnosis_area" required="1"/>
</tree>
```

### tablet_image widget
```xml
<field name="x_studio_repair_image_01" widget="tablet_image"/>
```

### Confirm dialog on button
```xml
<button type="action" name="%(helpdesk_repair.action_create_repair_serial)d"
        string="Create Repair Serial"
        class="btn-primary"
        confirm="Are you sure you want to create repair serial no?"
        invisible="..."/>
```

## 6. Key Inherited View References

| Model | View type | External ID |
|---|---|---|
| `helpdesk.ticket` | form | `helpdesk.helpdesk_ticket_view_form` |
| `helpdesk.ticket` | tree | `helpdesk.helpdesk_tickets_view_tree` |
| `helpdesk.ticket` | kanban | `helpdesk.helpdesk_ticket_view_kanban` |
| `helpdesk.ticket.type` | tree | `helpdesk.helpdesk_ticket_type_view_tree` |
| `project.task` | form | `project.view_task_form2` |

## 7. Security

### res_groups.xml
```xml
<record id="group_repair_sales_unlock" model="res.groups">
    <field name="name">Repair Sales Unlock</field>
    <field name="share" eval="True"/>
</record>
```

### ir.model.access.csv pattern
```
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_x_repair_stages_user,x_repair_stages.user,model_x_repair_stages,base.group_user,1,0,0,0
access_x_repair_stages_system,x_repair_stages.system,model_x_repair_stages,base.group_system,1,1,1,1
```

Apply same pattern for all 12 custom models.

## 8. Server Action Pattern (for workflow buttons)

Server actions replace Studio's `stub_action_NNNN` references:

```python
# models/helpdesk_ticket.py
def action_send_to_factory(self):
    self.ensure_one()
    self.x_studio_send_to_factory = True
    # advance to "SENT TO FACTORY" stage
    stage = self.env['helpdesk.stage'].search([('name', '=', 'SENT TO FACTORY')], limit=1)
    if stage:
        self.stage_id = stage

def action_receive_at_factory(self):
    self.ensure_one()
    self.x_studio_receive_at_factory = True
    stage = self.env['helpdesk.stage'].search([('name', '=', 'RECEIVED AT FACTORY')], limit=1)
    if stage:
        self.stage_id = stage

def action_cancel_repair(self):
    self.ensure_one()
    self.x_studio_cancelled = True
    stage = self.env['helpdesk.stage'].search([('name', '=', 'CANCELLED')], limit=1)
    if stage:
        self.x_studio_cancelled_stage_id = self.stage_id
        self.stage_id = stage

def action_reopen_repair(self):
    self.ensure_one()
    self.x_studio_cancelled = False
    if self.x_studio_cancelled_stage_id:
        self.stage_id = self.x_studio_cancelled_stage_id
```

## 9. Action Name Mapping (Studio → Module)

| Studio stub | Module action ref |
|---|---|
| `stub_action_2001` | `helpdesk_repair.action_send_to_factory` |
| `stub_action_2002` | `helpdesk_repair.action_receive_at_factory` |
| `stub_action_2006` | `helpdesk_repair.action_receive_at_sales_centre` |
| `stub_action_2007` | `helpdesk_repair.action_send_to_sales_centre` |
| `stub_action_2220` | `helpdesk_repair.action_cancel_repair` |
| `stub_action_2221` | `helpdesk_repair.action_reopen_repair` |
| `stub_action_2343` | `helpdesk_repair.action_cancel_repair_stage10` |
| `stub_action_1993` | `helpdesk_repair.action_create_repair_route` |
| `stub_action_1994` | `helpdesk_repair.action_create_repair_serial` |
| `stub_action_2159` | `helpdesk_repair.action_change_type_to_rug` |
| `stub_action_2450` | `helpdesk_repair.action_update_serial` |
| `stub_action_2224` | `helpdesk_repair.action_view_repair_diagnosis_validation` |
| `stub_action_2242` | `helpdesk_repair.action_view_repair_image_validation` |
| `stub_action_2316` | `helpdesk_repair.action_tested_ok` |
