from odoo import api, fields, models


class ProjectTask(models.Model):
    _inherit = 'project.task'

    x_studio_created_date = fields.Datetime(string='Created Date')
    x_studio_repair_reason = fields.Many2many(
        'x_repair_reason',
        'x_project_task_x_repair_reason_rel',
        string='Repair Reason')
    x_studio_priority = fields.Integer(string='Priority')
    x_studio_quotation_type = fields.Selection([
        ('Repair', 'Repair'),
        ('Project', 'Project'),
    ], string='Quotation Type')
    x_studio_material_availability = fields.Char(string='Material Availability')
    x_studio_repair_image_01 = fields.Binary(string='Repair Image 01')
    x_studio_repair_image_02 = fields.Binary(string='Repair Image 02')
    x_studio_warranty_card = fields.Binary(
        related='helpdesk_ticket_id.x_studio_warranty_card', readonly=True,
        string='Warranty Card')
    x_studio_related_information = fields.Binary(
        related='helpdesk_ticket_id.x_studio_related_information', readonly=True,
        string='Related Information')
    x_studio_diagnosis_ids = fields.One2many(
        'x_task_diagnosis', 'x_studio_task_id', string='Diagnosis')
    x_studio_cancelled = fields.Boolean(string='Cancelled')
    x_studio_end_quick_repair = fields.Boolean(string='End Quick Repair')
    x_studio_valid_diagnosis = fields.Boolean(
        compute='_compute_valid_diagnosis', store=True, readonly=True,
        string='Valid Diagnosis')
    x_studio_diagnosis_area_1 = fields.Many2one(
        'x_diagnosis_areas', string='Diagnosis Area')
    x_studio_reason_code = fields.Many2one(
        'x_repair_reason', string='Reason Code')

    # =========================================================================
    # Computed field stubs
    # =========================================================================

    def _compute_valid_diagnosis(self):
        # TODO: implement from ir_actions_server.xml automation logic in studio_customization
        for rec in self:
            rec.x_studio_valid_diagnosis = False

    # =========================================================================
    # TASK-30: Diagnostic task action methods
    # =========================================================================

    def action_view_repair_diagnosis_validation(self):
        """Open the Task Diagnosis records linked to this task."""
        self.ensure_one()
        return {
            'type': 'ir.actions.act_window',
            'name': 'Repair Diagnosis',
            'res_model': 'x_task_diagnosis',
            'view_mode': 'tree,form',
            'domain': [('x_studio_task_id', '=', self.id)],
            'context': {'default_x_studio_task_id': self.id},
        }

    def action_view_repair_image_validation(self):
        """Indicate that repair image validation is required.
        TODO: Full implementation may open a wizard or return a notification.
        See studio_customization/data/ir_actions_server.xml — stub_action_2242.
        """
        self.ensure_one()
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': 'Repair Image Validation',
                'message': 'Please upload repair images in the Repair Image tab.',
                'type': 'warning',
            },
        }

    def action_tested_ok(self):
        """Mark the FSM task as tested OK and optionally advance the helpdesk ticket stage."""
        self.ensure_one()
        self.x_studio_end_quick_repair = True
