from odoo import api, fields, models


class StockPicking(models.Model):
    _inherit = 'stock.picking'

    x_studio_helpdesk_ticket_id = fields.Many2one(
        'helpdesk.ticket', string='Helpdesk Ticket Id')
    x_studio_created_from_help_ticket = fields.Many2one(
        'helpdesk.ticket',
        readonly=True,
        related='x_studio_helpdesk_ticket_id',
        string='Created From Help Ticket')
    x_studio_factory_repair = fields.Boolean(
        compute='_compute_factory_repair',
        string='Factory Repair',
        store=True,
        readonly=True)
    x_studio_valid_factory_repair = fields.Boolean(
        compute='_compute_valid_factory_repair',
        store=True,
        readonly=True,
        string='Valid Factory Repair')
    x_studio_received_at_centre = fields.Boolean(
        compute='_compute_received_at_centre',
        store=True,
        readonly=True,
        string='Received at Centre')
    x_studio_task_status = fields.Boolean(
        compute='_compute_task_status',
        store=True,
        readonly=True,
        string='Task Status')
    x_studio_fsm_task_done = fields.Boolean(
        compute='_compute_fsm_task_done',
        store=True,
        readonly=True,
        string='FSM Task Done')
    x_studio_fully_paid_so = fields.Boolean(string='Fully Paid SO')
    x_studio_cancelled = fields.Boolean(string='Cancelled')
    x_studio_validation = fields.Boolean(
        compute='_compute_validation',
        store=True,
        readonly=True,
        string='Validation')

    # =========================================================================
    # Computed field implementations
    # =========================================================================

    @api.depends(
        'x_studio_created_from_help_ticket',
        'x_studio_created_from_help_ticket.x_studio_receive_at_factory',
        'x_studio_created_from_help_ticket.x_studio_job_location',
        'x_studio_helpdesk_ticket_id',
        'x_studio_helpdesk_ticket_id.x_studio_receive_at_factory',
        'x_studio_helpdesk_ticket_id.x_studio_job_location',
    )
    def _compute_factory_repair(self):
        for rec in self:
            value = False
            if rec.x_studio_created_from_help_ticket:
                if rec.x_studio_created_from_help_ticket.x_studio_receive_at_factory:
                    value = True
            elif rec.x_studio_helpdesk_ticket_id:
                if rec.x_studio_helpdesk_ticket_id.x_studio_receive_at_factory:
                    value = True
            rec.x_studio_factory_repair = value

    # --- Stub computed fields ---
    # TODO: implement from ir_actions_server.xml automation logic in studio_customization

    def _compute_valid_factory_repair(self):
        for rec in self:
            rec.x_studio_valid_factory_repair = False

    def _compute_received_at_centre(self):
        for rec in self:
            rec.x_studio_received_at_centre = False

    def _compute_task_status(self):
        for rec in self:
            rec.x_studio_task_status = False

    def _compute_fsm_task_done(self):
        for rec in self:
            rec.x_studio_fsm_task_done = False

    def _compute_validation(self):
        for rec in self:
            rec.x_studio_validation = False
