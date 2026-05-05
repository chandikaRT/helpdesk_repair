# Module Standards — Helpdesk Repair Module

## 1. Menu Structure

```
Helpdesk (helpdesk.menu_helpdesk_root)
└── Repair Diagnosis  [sequence=101]
    ├── Symptom Areas          [sequence=1]   → x_symptom_areas
    ├── Symptom Codes          [sequence=2]   → x_symptom_codes
    ├── Diagnosis Areas        [sequence=3]   → x_diagnosis_areas
    ├── Diagnosis Codes        [sequence=4]   → x_diagnosis_codes
    ├── Repair Reason          [sequence=5]   → x_repair_reason
    ├── Repair Reason - Customer [sequence=6] → x_repair_reason_custom
    ├── Repair Sub Reason      [sequence=7]   → x_repair_sub_reason
    ├── Resolutions            [sequence=8]   → x_resolutions
    ├── Repair Stages          [sequence=9]   → x_repair_stages
    └── Conditions             [no sequence]  → x_conditions

Helpdesk > Configuration (helpdesk.helpdesk_menu_config)
└── Repair Accounts  [sequence=7]             → x_repair_accounts

Helpdesk > Reporting (helpdesk.helpdesk_ticket_report_menu_main)
├── Repair Job Details          [sequence=3]
└── Repair Sales Order List     [sequence=4]
```

### menus.xml excerpt
```xml
<menuitem id="menu_helpdesk_repair_diagnosis"
          name="Repair Diagnosis"
          parent="helpdesk.menu_helpdesk_root"
          action="base.action_open_website"
          sequence="101"/>

<menuitem id="menu_symptom_areas"
          name="Symptom Areas"
          parent="menu_helpdesk_repair_diagnosis"
          action="action_x_symptom_areas"
          sequence="1"/>
<!-- ... repeat for all sub-menus ... -->

<menuitem id="menu_repair_accounts"
          name="Repair Accounts"
          parent="helpdesk.helpdesk_menu_config"
          action="action_x_repair_accounts"
          sequence="7"/>
```

---

## 2. Standard View Structure — New Models

Every new master data model follows this form/tree/action pattern. Example for `x_repair_stages`:

### Form view
```xml
<record id="view_x_repair_stages_form" model="ir.ui.view">
    <field name="name">x.repair.stages.form</field>
    <field name="model">x_repair_stages</field>
    <field name="arch" type="xml">
        <form>
            <sheet>
                <widget name="web_ribbon" text="Archived"
                        bg_color="bg-danger"
                        invisible="x_active == True"/>
                <field name="x_active" invisible="1"/>
                <div class="oe_title">
                    <h1>
                        <field name="x_name" required="1" placeholder="Name..."/>
                    </h1>
                </div>
                <group>
                    <group>
                        <field name="x_studio_sequence"/>
                        <field name="x_studio_company_id"/>
                    </group>
                    <group>
                        <field name="x_studio_description"/>
                    </group>
                </group>
            </sheet>
            <div class="oe_chatter">
                <field name="message_follower_ids"/>
                <field name="activity_ids"/>
                <field name="message_ids"/>
            </div>
        </form>
    </field>
</record>
```

### Tree view
```xml
<record id="view_x_repair_stages_tree" model="ir.ui.view">
    <field name="name">x.repair.stages.tree</field>
    <field name="model">x_repair_stages</field>
    <field name="arch" type="xml">
        <tree>
            <field name="x_studio_sequence" widget="handle"/>
            <field name="x_name"/>
            <field name="x_active"/>
        </tree>
    </field>
</record>
```

### Window action
```xml
<record id="action_x_repair_stages" model="ir.actions.act_window">
    <field name="name">Repair Stages</field>
    <field name="res_model">x_repair_stages</field>
    <field name="view_mode">tree,form</field>
    <field name="limit">80</field>
</record>
```

Apply this same pattern for all 12 custom models. Models with a Many2one foreign key (like `x_diagnosis_codes.x_studio_diagnosis_area_1`) should show that field prominently in the form.

---

## 3. `x_repair_reason` and `x_repair_reason_custom` — Color Tag Pattern

These models have `x_color` (Integer) for tag coloring. In tree views use `widget="many2many_tags"` when displayed as tags (e.g., on `helpdesk.ticket` tree).

---

## 4. `x_repair_sub_reason` — Filtered by Reason

The `x_studio_reason_code` field links sub-reasons to their parent reason. In the diagnosis tree, apply domain filter:
```xml
<field name="x_studio_sub_reason"
       domain="[['x_studio_reason_code','=',x_studio_reason]]"
       required="1"/>
```

---

## 5. `x_diagnosis_codes` — Filtered by Area

The `x_studio_diagnosis_area_1` field links codes to their parent area. In the diagnosis tree:
```xml
<field name="x_studio_diagnosis_code"
       domain="[['x_studio_diagnosis_area_1','=',x_studio_diagnosis_area]]"
       required="1"/>
```

---

## 6. `x_symptom_codes` — Filtered by Symptom Area

```xml
<field name="x_studio_symptom_code"
       domain="[['x_studio_symptom_area','=',x_studio_symptom_area]]"/>
```

---

## 7. `x_task_diagnosis` Views

### Form view (for standalone access)
```xml
<form>
    <sheet>
        <field name="x_active" invisible="1"/>
        <div class="oe_title">
            <h1><field name="x_name" required="1"/></h1>
        </div>
        <group>
            <group>
                <field name="x_studio_condition"/>
                <field name="x_studio_symptom_area"/>
                <field name="x_studio_symptom_code"
                       domain="[['x_studio_symptom_area','=',x_studio_symptom_area]]"/>
                <field name="x_studio_description"/>
                <field name="x_studio_diagnosis_area"/>
                <field name="x_studio_diagnosis_code"
                       domain="[['x_studio_diagnosis_area_1','=',x_studio_diagnosis_area]]"/>
            </group>
            <group>
                <field name="x_studio_reason"/>
                <field name="x_studio_sub_reason"
                       domain="[['x_studio_reason_code','=',x_studio_reason]]"/>
                <field name="x_studio_resolution"/>
                <field name="x_studio_repair_stage"/>
                <field name="x_studio_task_id"/>
            </group>
        </group>
    </sheet>
    <div class="oe_chatter">
        <field name="message_follower_ids"/>
        <field name="activity_ids"/>
        <field name="message_ids"/>
    </div>
</form>
```

### Embedded tree in `project.task` form (Repair Diagnosis tab)
```xml
<page string="Repair Diagnosis" name="studio_page_M5qFQ"
      invisible="helpdesk_ticket_id == False">
    <field name="x_studio_diagnosis_ids" force_save="True"
           required="helpdesk_ticket_id != False">
        <tree editable="bottom">
            <field name="x_studio_sequence" widget="handle"/>
            <field name="x_name" column_invisible="True"/>
            <field name="x_studio_condition" optional="show" column_invisible="True"/>
            <field name="x_studio_symptom_area" optional="show" column_invisible="True"/>
            <field name="x_studio_symptom_code" optional="show" column_invisible="True"/>
            <field name="x_studio_description" optional="show"/>
            <field name="x_studio_diagnosis_area" optional="show" required="1"/>
            <field name="x_studio_diagnosis_code" optional="show" required="1"
                   domain="[['x_studio_diagnosis_area_1','=',x_studio_diagnosis_area]]"/>
            <field name="x_studio_reason" optional="show" required="1"/>
            <field name="x_studio_sub_reason" optional="show" required="1"
                   domain="[['x_studio_reason_code','=',x_studio_reason]]"/>
            <field name="x_studio_resolution" optional="show" required="1"/>
            <field name="x_studio_repair_stage" optional="show" required="1"/>
            <field name="x_studio_task_id" optional="show" invisible="1"/>
        </tree>
    </field>
</page>
```

---

## 8. `helpdesk.ticket` Form View Customization (exact xpath layout)

```xml
<record id="view_helpdesk_ticket_form_repair" model="ir.ui.view">
    <field name="name">helpdesk.ticket.form.repair</field>
    <field name="inherit_id" ref="helpdesk.helpdesk_ticket_view_form"/>
    <field name="model">helpdesk.ticket</field>
    <field name="priority">99</field>
    <field name="arch" type="xml">
      <data>
        <!-- Invisible modifier fields -->
        <xpath expr="//form[1]" position="inside">
            <field name="domain_user_ids" invisible="1"/>
        </xpath>

        <!-- Move ticket_type_id and add location fields after user_id -->
        <xpath expr="//form[1]/sheet[1]/group[1]/group[1]/field[@name='user_ids']"
               position="after">
            <xpath expr="//field[@name='ticket_type_id']" position="move"/>
            <field name="x_studio_return_receipt_location"
                   options="{'no_create': True}"/>
            <field name="x_studio_repair_location"
                   invisible="domain_user_ids == [146]"/>
            <field name="x_studio_job_location"/>
        </xpath>

        <!-- After priority: re-estimate fields -->
        <xpath expr="//field[@name='priority']" position="after">
            <field name="x_studio_re_estimate_status"/>
            <field name="x_studio_re_estimate_count"
                   widget="many2one_reference"
                   options="{'enable_formatting': false}"/>
        </xpath>

        <!-- After partner_id: name and email -->
        <xpath expr="//field[@name='partner_id']" position="after">
            <field name="partner_name"/>
            <field name="partner_email" string="Email"/>
        </xpath>

        <!-- After email_cc: product and serial info -->
        <xpath expr="//field[@name='email_cc']" position="after">
            <field name="x_studio_serial_no"/>
            <field name="product_id"/>
            <field name="x_studio_tracking"/>
            <field name="x_studio_source_location"/>
            <field name="x_studio_quick_repair_status"/>
        </xpath>

        <!-- After second sale_order_id: RUG fields -->
        <xpath expr="//form[1]/sheet[1]/group[1]/group[2]/field[@name='sale_order_id'][2]"
               position="after">
            <field name="x_studio_rug_approved" invisible="True"/>
            <field name="x_studio_rug_request_sent"/>
            <field name="x_studio_repair_serial_created"/>
        </xpath>

        <!-- Tabs: Warranty Details and Cancel/Reopen Log -->
        <xpath expr="//form[1]/sheet[1]/notebook[1]" position="inside">
            <page string="Warranty Details" name="studio_page_2rr_1igln0ot0">
                <group name="studio_group_2rr">
                    <group name="studio_group_2rr_left">
                        <field name="x_studio_warranty_card" widget="tablet_image"/>
                    </group>
                    <group name="studio_group_2rr_right">
                        <field name="x_studio_related_information" widget="tablet_image"/>
                    </group>
                </group>
            </page>
            <page string="Cancel/ Reopen Log" name="studio_page_5b5_1igln4fa1">
                <group name="studio_group_5b5">
                    <group name="studio_group_5b5_left">
                        <field name="x_studio_cancelled_by"/>
                        <field name="x_studio_cancelled_date"/>
                        <field name="x_studio_reopened_by"/>
                        <field name="x_studio_reopened_date"/>
                    </group>
                </group>
            </page>
        </xpath>

        <!-- ticket_type_id attributes -->
        <xpath expr="//field[@name='ticket_type_id']" position="attributes">
            <attribute name="force_save">1</attribute>
            <attribute name="readonly">x_studio_rug_approved == True</attribute>
            <attribute name="required">user_id</attribute>
        </xpath>

        <!-- stage_id not clickable -->
        <xpath expr="//field[@name='stage_id']" position="attributes">
            <attribute name="options">{'clickable': False}</attribute>
        </xpath>

        <!-- sale_order_id domain restriction -->
        <xpath expr="//field[@name='sale_order_id']" position="attributes">
            <attribute name="domain">[["partner_id","=",partner_id]]</attribute>
        </xpath>
      </data>
    </field>
</record>
```

---

## 9. `helpdesk.ticket` Button View (separate view, priority=50000)

```xml
<record id="view_helpdesk_ticket_form_repair_buttons" model="ir.ui.view">
    <field name="name">helpdesk.ticket.form.repair.buttons</field>
    <field name="inherit_id" ref="helpdesk.helpdesk_ticket_view_form"/>
    <field name="model">helpdesk.ticket</field>
    <field name="priority">50000</field>
    <field name="arch" type="xml">
      <data>
        <!-- Invisible modifier fields on form root -->
        <xpath expr="//form[1]" position="inside">
            <field name="x_studio_cancelled" invisible="1"/>
            <field name="x_studio_cancelled_2" invisible="1"/>
            <field name="x_studio_estimation_approved_stage_updated" invisible="1"/>
            <field name="x_studio_fsm_task_done" invisible="1"/>
            <field name="x_studio_job_location" invisible="1"/>
            <field name="x_studio_normal_repair_with_serial_no" invisible="1"/>
            <field name="x_studio_normal_repair_without_serial_no" invisible="1"/>
            <field name="x_studio_receive_at_centre" invisible="1"/>
            <field name="x_studio_receive_at_factory" invisible="1"/>
            <field name="x_studio_repair_reason" invisible="1"/>
            <field name="x_studio_repair_serial_created" invisible="1"/>
            <field name="x_studio_return_receipt_location" invisible="1"/>
            <field name="x_studio_rug_repair" invisible="1"/>
            <field name="x_studio_send_to_centre" invisible="1"/>
            <field name="x_studio_send_to_factory" invisible="1"/>
            <field name="x_studio_serial_no" invisible="1"/>
            <field name="x_studio_sn_updated" invisible="1"/>
            <field name="x_studio_task_status" invisible="1"/>
            <field name="x_studio_tracking" invisible="1"/>
            <field name="x_studio_valid_confirm_return" invisible="1"/>
            <field name="x_studio_valid_return" invisible="1"/>
            <field name="fsm_task_count" invisible="1"/>
            <field name="product_id" invisible="1"/>
            <field name="use_product_returns" invisible="1"/>
        </xpath>

        <!-- Change Repair Type To RUG button -->
        <xpath expr="//header/button[@name='assign_ticket_to_self']" position="before">
            <button type="object" name="action_change_type_to_rug"
                    string="Change Repair Type To RUG"
                    class="btn-primary"
                    confirm="Are you sure you want to change the repair type to RUG?"
                    invisible="(x_studio_estimation_approved_stage_updated == True) or ((x_studio_valid_return == False) or ((x_studio_normal_repair_with_serial_no == False) or (x_studio_cancelled == True)))"/>
        </xpath>

        <!-- Update Serial button -->
        <xpath expr="//button[@name='%(stock.act_stock_return_picking)d']" position="before">
            <button type="object" name="action_update_serial"
                    string="Update Serial"
                    class="btn-primary"
                    invisible="((x_studio_sn_updated == True) and (x_studio_rug_repair == True)) or (((x_studio_sn_updated == True) and (x_studio_normal_repair_with_serial_no == True)) or ((x_studio_serial_no == False) or (x_studio_normal_repair_without_serial_no == True)))"/>
        </xpath>

        <!-- Receipt button (without serial) — after assign_ticket_to_self -->
        <xpath expr="//header/button[@name='assign_ticket_to_self']" position="after">
            <button type="object" name="action_create_receipt"
                    string="Receipt"
                    groups="stock.group_stock_user"
                    context="{'default_ticket_id': id, 'default_company_id': company_id, 'default_location_id': x_studio_virtual_location_id, 'default_picking_id': x_studio_pick_id}"
                    invisible="((x_studio_repair_serial_created == False) and (x_studio_normal_repair_without_serial_no == True)) or ((x_studio_normal_repair_without_serial_no == False) or ((x_studio_normal_repair_with_serial_no == True) or ((x_studio_rug_repair == True) or ((x_studio_valid_return == True) or ((ticket_type_id == False) or ((use_product_returns == False) or (x_studio_cancelled == True)))))))"/>
        </xpath>

        <!-- Return button — modify existing Return button visibility (RUG) -->
        <xpath expr="//button[@name='%(stock.act_stock_return_picking)d']" position="attributes">
            <attribute name="invisible">((x_studio_sn_updated == False) and (x_studio_normal_repair_without_serial_no == False)) or ((x_studio_rug_repair != True) or ((ticket_type_id == False) or ((x_studio_valid_return == True) or ((use_product_returns == False) or (x_studio_cancelled == True)))))</attribute>
            <attribute name="context">{'default_ticket_id': id, 'default_company_id': company_id, 'default_picking_id': x_studio_pick_id}</attribute>
        </xpath>

        <!-- Create Repair Route button -->
        <xpath expr="//header/button[@name='%(stock.act_stock_return_picking)d']][3]" position="before">
            <button type="object" name="action_create_repair_route"
                    string="Create Repair Route"
                    class="btn-primary"
                    confirm="Are you sure you want to create repair route?"
                    context="{'default_ticket_id': id, 'default_company_id': company_id, 'default_picking_id': x_studio_pick_id}"
                    invisible="((x_studio_tracking != 'none') and (x_studio_normal_repair_without_serial_no == True)) or (((x_studio_repair_serial_created == True) and (x_studio_normal_repair_without_serial_no == True)) or ((x_studio_normal_repair_without_serial_no != True) or ((x_studio_normal_repair_with_serial_no == True) or ((x_studio_rug_repair == True) or ((ticket_type_id == False) or ((use_product_returns == False) or (x_studio_cancelled == True))))))))"/>
        </xpath>

        <!-- Create Repair Serial button -->
        <xpath expr="//header/button[@name='action_create_repair_route']" position="after">
            <button type="object" name="action_create_repair_serial"
                    string="Create Repair Serial"
                    class="btn-primary"
                    confirm="Are you sure you want to create repair serial no?"
                    context="{'default_ticket_id': id, 'default_company_id': company_id, 'default_picking_id': x_studio_pick_id}"
                    invisible="((x_studio_tracking != 'serial') and (x_studio_normal_repair_without_serial_no == True)) or (((x_studio_repair_serial_created == True) and (x_studio_normal_repair_without_serial_no == True)) or ((x_studio_normal_repair_without_serial_no != True) or ((x_studio_normal_repair_with_serial_no == True) or ((x_studio_rug_repair == True) or ((ticket_type_id == False) or ((use_product_returns == False) or (x_studio_cancelled == True))))))))"/>
        </xpath>

        <!-- Send to Factory button -->
        <xpath expr="//header/button[@name='action_generate_fsm_task']" position="before">
            <button type="object" name="action_send_to_factory"
                    string="Send to Factory"
                    class="btn-primary"
                    invisible="(x_studio_job_location != 'Factory Repair') or ((x_studio_send_to_factory == True) or ((x_studio_valid_confirm_return == False) or ((x_studio_valid_return == False) or ((fsm_task_count &gt; 0) or (x_studio_cancelled == True)))))"/>
        </xpath>

        <!-- Receive at Factory button -->
        <xpath expr="//header/button[@name='action_send_to_factory']" position="after">
            <button type="object" name="action_receive_at_factory"
                    string="Receive at Factory"
                    class="btn-primary"
                    invisible="((x_studio_send_to_factory == False) and (x_studio_job_location == 'Factory Repair')) or ((x_studio_job_location != 'Factory Repair') or ((x_studio_receive_at_factory == True) or ((x_studio_valid_confirm_return == False) or ((x_studio_valid_return == False) or ((fsm_task_count &gt; 0) or (x_studio_cancelled == True))))))"/>
        </xpath>

        <!-- Modify action_generate_fsm_task visibility -->
        <xpath expr="//button[@name='action_generate_fsm_task']" position="attributes">
            <attribute name="invisible">((x_studio_receive_at_factory == False) and (x_studio_job_location == 'Factory Repair')) or ((x_studio_valid_confirm_return == False) or ((x_studio_valid_return == False) or ((use_fsm == False) or ((fsm_task_count &gt; 0) or (x_studio_cancelled == True)))))</attribute>
        </xpath>

        <!-- Send to Sales Centre button (before Receive at Factory) -->
        <xpath expr="//header/button[@name='action_receive_at_factory']" position="before">
            <button type="object" name="action_send_to_sales_centre"
                    string="Send to Sales Centre"
                    class="btn-primary"
                    invisible="(x_studio_job_location != 'Factory Repair') or ((x_studio_send_to_centre == True) or ((x_studio_receive_at_factory == False) or ((x_studio_task_status == False) or ((x_studio_cancelled == True) or (x_studio_fsm_task_done == False)))))"/>
        </xpath>

        <!-- Receive at Sales Centre button -->
        <xpath expr="//header/button[@name='action_send_to_sales_centre']" position="after">
            <button type="object" name="action_receive_at_sales_centre"
                    string="Receive at Sales Centre"
                    class="btn-primary"
                    invisible="((x_studio_send_to_centre == False) and (x_studio_job_location == 'Factory Repair')) or ((x_studio_job_location != 'Factory Repair') or ((x_studio_receive_at_centre == True) or ((x_studio_task_status == False) or (x_studio_cancelled == True))))"/>
        </xpath>

        <!-- Cancel button (for in-progress stages) -->
        <xpath expr="//header/button[@name='action_receive_at_sales_centre']" position="before">
            <button type="object" name="action_cancel_repair"
                    string="Cancel"
                    class="btn-primary"
                    confirm="Are you sure you want to cancel the repair ticket?"
                    invisible="(product_id == False) or ((x_studio_serial_no == False) or ((partner_id == False) or ((x_studio_repair_reason == False) or ((x_studio_return_receipt_location == False) or ((ticket_type_id == False) or ((x_studio_cancelled == True) or (stage_id in [3, 4, 7, 8, 9, 10, 11, 12, 13])))))))"/>
        </xpath>

        <!-- Cancel button (stage 10 only) -->
        <xpath expr="//header/button[@name='action_cancel_repair']" position="before">
            <button type="object" name="action_cancel_repair_stage10"
                    string="Cancel"
                    class="btn-primary"
                    confirm="Are you sure you want to cancel the repair ticket?"
                    invisible="(product_id == False) or ((x_studio_serial_no == False) or ((partner_id == False) or ((x_studio_repair_reason == False) or ((x_studio_return_receipt_location == False) or ((ticket_type_id == False) or ((x_studio_cancelled_2 == True) or (stage_id not in [10])))))))"/>
        </xpath>

        <!-- Reopen button -->
        <xpath expr="//header/button[@name='action_cancel_repair']" position="before">
            <button type="object" name="action_reopen_repair"
                    string="Reopen"
                    class="btn-primary"
                    confirm="Are you sure you want to reopen the repair ticket?"
                    invisible="x_studio_cancelled == False"/>
        </xpath>

        <!-- Repair Order button visibility -->
        <xpath expr="//header/button[@name='action_repair_order_form']" position="attributes">
            <attribute name="invisible">(use_product_repairs == False) or ((pickings_count == 0) or (x_studio_cancelled == True))</attribute>
        </xpath>
      </data>
    </field>
</record>
```

---

## 10. `helpdesk.ticket` Tree View Customization

```xml
<record id="view_helpdesk_ticket_tree_repair" model="ir.ui.view">
    <field name="name">helpdesk.ticket.tree.repair</field>
    <field name="inherit_id" ref="helpdesk.helpdesk_tickets_view_tree"/>
    <field name="model">helpdesk.ticket</field>
    <field name="priority">900</field>
    <field name="arch" type="xml">
      <data>
        <xpath expr="//field[@name='partner_id']" position="replace"/>
        <xpath expr="//tree[1]/field[@name='team_id']" position="replace">
            <field name="partner_name" optional="show"/>
            <field name="create_date" optional="show" widget="date"/>
            <field name="x_studio_materials_used" optional="show" string="Materials Used"/>
            <field name="x_studio_quantity" optional="show" string="Quantity"/>
            <field name="x_studio_unit_price" optional="show" string="Unit Price"/>
            <field name="x_studio_items" optional="show" widget="many2many_tags"/>
            <field name="x_studio_qty" optional="show"/>
            <field name="x_studio_sales_price" optional="show"/>
            <field name="close_date" optional="show"/>
        </xpath>
        <xpath expr="//field[@name='sla_deadline']" position="after">
            <field name="x_studio_repair_reason" optional="show" widget="many2many_tags"/>
        </xpath>
      </data>
    </field>
</record>
```

---

## 11. `project.task` Form View Customization

```xml
<record id="view_project_task_form_repair" model="ir.ui.view">
    <field name="name">project.task.form.repair</field>
    <field name="inherit_id" ref="project.view_task_form2"/>
    <field name="model">project.task</field>
    <field name="priority">99</field>
    <field name="arch" type="xml">
      <data>
        <!-- Invisible modifier fields -->
        <xpath expr="//form[1]" position="inside">
            <field name="x_studio_diagnosis_area_1" invisible="1"/>
            <field name="x_studio_reason_code" invisible="1"/>
        </xpath>

        <!-- Buttons after personal_stage_type_id -->
        <xpath expr="//field[@name='personal_stage_type_id']" position="after">
            <button type="object" name="action_view_repair_diagnosis_validation"
                    string="View Repair Diagnosis Validation"
                    class="btn-primary"/>
            <button type="object" name="action_view_repair_image_validation"
                    string="View Repair Image Validation"
                    class="btn-primary"/>
            <button type="object" name="action_tested_ok"
                    string="Tested OK"
                    class="btn-primary"/>
        </xpath>

        <!-- Fields after user_ids -->
        <xpath expr="//form[1]/sheet[1]/group[1]/group[1]/field[@name='user_ids']"
               position="after">
            <field name="helpdesk_ticket_id" string="Help Desk Ticket"/>
            <field name="x_studio_created_date"/>
            <field name="x_studio_repair_reason" invisible="True"/>
        </xpath>

        <!-- Fields in right group -->
        <xpath expr="//form[1]/sheet[1]/group[1]/group[2]/div[3]" position="after">
            <field name="x_studio_priority"/>
            <field name="x_studio_quotation_type"/>
            <field name="x_studio_material_availability"/>
        </xpath>

        <!-- Tabs: Repair Image, Warranty Card, Repair Diagnosis -->
        <xpath expr="//form[1]/sheet[1]/notebook[1]" position="inside">
            <page string="Repair Image" name="studio_page_8ci_1ik1qk8tm">
                <group name="studio_group_8ci">
                    <group name="studio_group_8ci_left">
                        <field name="x_studio_repair_image_01" widget="tablet_image"/>
                    </group>
                    <group name="studio_group_8ci_right">
                        <field name="x_studio_repair_image_02" widget="tablet_image"/>
                    </group>
                </group>
            </page>
            <page string="Warranty Card" name="studio_page_8db_1ik1r0ore">
                <group name="studio_group_8db">
                    <group name="studio_group_8db_left">
                        <field name="x_studio_warranty_card" widget="image"/>
                    </group>
                    <group name="studio_group_8db_right">
                        <field name="x_studio_related_information" widget="image"/>
                    </group>
                </group>
            </page>
            <page string="Repair Diagnosis" name="studio_page_M5qFQ"
                  invisible="helpdesk_ticket_id == False">
                <field name="x_studio_diagnosis_ids" force_save="True"
                       required="helpdesk_ticket_id != False">
                    <tree editable="bottom">
                        <field name="x_studio_sequence" widget="handle"/>
                        <field name="x_name" column_invisible="True"/>
                        <field name="x_studio_condition" optional="show" column_invisible="True"/>
                        <field name="x_studio_symptom_area" optional="show" column_invisible="True"/>
                        <field name="x_studio_symptom_code" optional="show" column_invisible="True"/>
                        <field name="x_studio_description" optional="show"/>
                        <field name="x_studio_diagnosis_area" optional="show" required="1"/>
                        <field name="x_studio_diagnosis_code" optional="show" required="1"
                               domain="[['x_studio_diagnosis_area_1','=',x_studio_diagnosis_area]]"/>
                        <field name="x_studio_reason" optional="show" required="1"/>
                        <field name="x_studio_sub_reason" optional="show" required="1"
                               domain="[['x_studio_reason_code','=',x_studio_reason]]"/>
                        <field name="x_studio_resolution" optional="show" required="1"/>
                        <field name="x_studio_repair_stage" optional="show" required="1"/>
                        <field name="x_studio_task_id" optional="show" invisible="1"/>
                    </tree>
                </field>
            </page>
        </xpath>
      </data>
    </field>
</record>
```

---

## 12. `helpdesk.ticket` Kanban Customization

```xml
<record id="view_helpdesk_ticket_kanban_repair" model="ir.ui.view">
    <field name="name">helpdesk.ticket.kanban.repair</field>
    <field name="inherit_id" ref="helpdesk.helpdesk_ticket_view_kanban"/>
    <field name="model">helpdesk.ticket</field>
    <field name="priority">99</field>
    <field name="arch" type="xml">
      <data>
        <!-- Stage date and reopen status fields in kanban -->
        <xpath expr="//kanban[1]" position="inside">
            <field name="x_studio_reopened_date"/>
            <field name="x_studio_reopen_status"/>
            <field name="x_studio_stage_date"/>
        </xpath>
      </data>
    </field>
</record>
```

---

## 13. Verification Checklist

After implementing the module, verify:

- [ ] All 12 custom models installable without error
- [ ] `helpdesk.ticket` form shows left-column fields in order: Helpdesk Team, Assigned to, Type, Return Receipt, Repair Location, Job Location, Repair Reason, Priority, Re-estimate Status, Re-estimate Count, Tags
- [ ] Right column shows: Customer, Email, Phone, Serial Number, Ref. Sales Order, Product, Tracking, Source Location, Cancel Reason, Quick Repair Status
- [ ] Tabs on helpdesk.ticket: Description, Repair Image (on task), Warranty Details, Repair Diagnosis (on task), Cancel/Reopen Log
- [ ] Statusbar shows all 13 stages; stage_id is not manually clickable
- [ ] "Send to Factory" button only visible for job_location='Factory Repair'
- [ ] Repair Diagnosis tab on project.task only visible when `helpdesk_ticket_id` is set
- [ ] Diagnosis tree shows: handle, Description, Diagnosis Area, Diagnosis Code (filtered), Reason (filtered), Sub Reason (filtered), Resolution, Repair Stage
- [ ] Repair Diagnosis menu visible under Helpdesk top nav with all 10 sub-menus
- [ ] "Repair Accounts" appears under Configuration menu
- [ ] access rules cover all 12 models (group_user read-only, group_system full CRUD)
