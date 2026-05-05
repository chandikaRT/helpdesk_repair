from odoo import api, fields, models


class HelpdeskTicket(models.Model):
    _inherit = 'helpdesk.ticket'

    # --- Left column location fields ---
    x_studio_return_receipt_location = fields.Many2one(
        'stock.location', string='Return Receipt', ondelete='set null')
    x_studio_repair_location = fields.Many2one(
        'stock.location', string='Repair Location', ondelete='set null')
    x_studio_job_location = fields.Char(string='Job Location')

    # --- After priority fields ---
    x_studio_re_estimate_status = fields.Char(
        string='Re-estimate Status',
        compute='_compute_re_estimate_status',
        store=True)
    x_studio_re_estimate_count = fields.Integer(
        compute='_compute_re_estimate_count',
        store=True)

    # --- Right column serial/product fields ---
    x_studio_serial_no = fields.Many2one('stock.lot', string='Serial Number')
    x_studio_tracking = fields.Char(string='Tracking')
    x_studio_source_location = fields.Many2one(
        'stock.location', string='Source Location')
    x_studio_quick_repair_status = fields.Char(string='Quick Repair Status')

    # --- RUG fields (after second sale_order_id) ---
    x_studio_rug_request_sent = fields.Boolean(string='RUG Request Sent')
    x_studio_repair_serial_created = fields.Boolean(string='Repair Serial Created')

    # --- Cancel/Reopen log fields ---
    x_studio_cancel_reason = fields.Text(string='Cancel Reason')
    x_studio_cancelled_by = fields.Many2one('res.users', string='Cancelled By')
    x_studio_cancelled_date = fields.Datetime(string='Cancelled Date')
    x_studio_reopened_by = fields.Many2one('res.users', string='Reopened By')
    x_studio_reopened_date = fields.Datetime(string='Reopened Date')

    # --- Warranty/binary fields ---
    x_studio_warranty_card = fields.Binary(string='Warranty Card')
    x_studio_related_information = fields.Binary(string='Related Information')

    # --- Related proxy fields (from ticket type) ---
    x_studio_rug_confirmed = fields.Boolean(
        related='ticket_type_id.x_studio_rug_confirmed', readonly=True)
    x_studio_rug_repair = fields.Boolean(
        related='ticket_type_id.x_studio_rug', readonly=True)
    x_studio_normal_repair_with_serial_no = fields.Boolean(
        related='ticket_type_id.x_studio_with_serial_no', readonly=True)
    x_studio_normal_repair_without_serial_no = fields.Boolean(
        related='ticket_type_id.x_studio_without_serial_no', readonly=True)

    # --- State tracking / process flags ---
    x_studio_cancelled_stage_id = fields.Many2one(
        'helpdesk.stage', string='Cancelled Stage', ondelete='set null')
    x_studio_repair_reason = fields.Many2many(
        'x_repair_reason',
        'x_helpdesk_ticket_x_repair_reason_custom_rel',
        string='Repair Reason')
    x_studio_serial_number = fields.Many2one(
        'stock.lot', string='Serial Number (Updated)', ondelete='set null')
    x_studio_receive_at_factory = fields.Boolean(string='Receive at Factory')
    x_studio_receive_at_centre = fields.Boolean(string='Receive at Centre')
    x_studio_send_to_factory = fields.Boolean(string='Send to Factory')
    x_studio_send_to_centre = fields.Boolean(string='Send to Centre')
    x_studio_cancelled = fields.Boolean(string='Cancelled')
    x_studio_cancelled_2 = fields.Boolean(string='Cancelled (Stage 10)')
    x_studio_sn_updated = fields.Boolean(string='SN Updated')
    x_studio_estimation_approved_stage_updated = fields.Boolean(
        string='Estimation Approved Stage Updated')
    x_studio_invoice_stage_updated = fields.Boolean(string='Invoice Stage Updated')
    x_studio_repair_started_stage_updated = fields.Boolean(string='Repair Started Stage Updated')
    x_studio_valid_return = fields.Boolean(string='Valid Return')
    x_studio_valid_confirm_return = fields.Boolean(string='Valid Confirm Return')
    x_studio_rug_approved = fields.Boolean(string='RUG Approved')

    # --- Kanban / stub fields ---
    x_studio_reopen_status = fields.Char(string='Reopen Status')
    x_studio_stage_date = fields.Datetime(string='Stage Date')

    # --- Computed boolean fields (stubs — TODO: implement from ir_actions_server.xml) ---
    x_studio_task_status = fields.Boolean(
        compute='_compute_task_status', store=True, readonly=True,
        string='Task Status')
    x_studio_fsm_task_done = fields.Boolean(
        compute='_compute_fsm_task_done', store=True, readonly=True,
        string='FSM Task Done')
    x_studio_handed_over = fields.Boolean(
        compute='_compute_handed_over', store=True, readonly=True,
        string='Handed Over')
    x_studio_valid_confirmed_so = fields.Boolean(
        compute='_compute_valid_confirmed_so', store=True, readonly=True,
        string='Valid Confirmed SO')
    x_studio_valid_confirmed2_so = fields.Boolean(
        compute='_compute_valid_confirmed2_so', store=True, readonly=True,
        string='Valid Confirmed2 SO')
    x_studio_valid_delivered_so = fields.Boolean(
        compute='_compute_valid_delivered_so', store=True, readonly=True,
        string='Valid Delivered SO')
    x_studio_valid_invoiced_so = fields.Boolean(
        compute='_compute_valid_invoiced_so', store=True, readonly=True,
        string='Valid Invoiced SO')
    x_studio_fully_paid_so = fields.Boolean(
        compute='_compute_fully_paid_so', store=True, readonly=True,
        string='Fully Paid SO')
    x_studio_user_location_validation = fields.Boolean(
        compute='_compute_user_location_validation', store=True, readonly=True,
        string='User Location Validation')

    # --- Computed char field (full implementation) ---
    x_studio_rug_approval_status = fields.Char(
        compute='_compute_rug_approval_status',
        string='RUG Approval Status',
        store=True)

    # --- Context / button support fields ---
    x_studio_pick_id = fields.Many2one('stock.picking', string='Pick Id')
    x_studio_virtual_location_id = fields.Many2one(
        'stock.location', string='Virtual Location')
    x_x_studio_created_from_help_ticket_stock_picking_count = fields.Integer(
        compute='_compute_stock_picking_count', store=True,
        string='Stock Picking Count')

    # =========================================================================
    # Computed field implementations
    # =========================================================================

    @api.depends('fsm_task_ids', 'fsm_task_ids.sale_order_id',
                 'fsm_task_ids.sale_order_id.x_studio_re_estimate_count')
    def _compute_re_estimate_status(self):
        for rec in self:
            val = 'None'
            for task in rec.fsm_task_ids:
                if task.sale_order_id.x_studio_re_estimate_count > 0:
                    val = 'Re-estimated'
            rec.x_studio_re_estimate_status = val

    @api.depends('fsm_task_ids', 'fsm_task_ids.sale_order_id',
                 'fsm_task_ids.sale_order_id.x_studio_rug_approved',
                 'fsm_task_ids.sale_order_id.x_studio_rug_rejected')
    def _compute_rug_approval_status(self):
        for rec in self:
            val = ''
            for task in rec.fsm_task_ids:
                so = self.env['sale.order'].search(
                    [('task_id', '=', task.id)], limit=1)
                if so.x_studio_rug_approved:
                    val = 'RUG Approved'
                elif so.x_studio_rug_rejected:
                    val = 'RUG Rejected'
            rec.x_studio_rug_approval_status = val

    # --- Stub computed fields ---
    # TODO: implement from ir_actions_server.xml automation logic in studio_customization

    def _compute_re_estimate_count(self):
        for rec in self:
            rec.x_studio_re_estimate_count = 0

    def _compute_task_status(self):
        for rec in self:
            rec.x_studio_task_status = False

    def _compute_fsm_task_done(self):
        for rec in self:
            rec.x_studio_fsm_task_done = False

    def _compute_handed_over(self):
        for rec in self:
            rec.x_studio_handed_over = False

    def _compute_valid_confirmed_so(self):
        for rec in self:
            rec.x_studio_valid_confirmed_so = False

    def _compute_valid_confirmed2_so(self):
        for rec in self:
            rec.x_studio_valid_confirmed2_so = False

    def _compute_valid_delivered_so(self):
        for rec in self:
            rec.x_studio_valid_delivered_so = False

    def _compute_valid_invoiced_so(self):
        for rec in self:
            rec.x_studio_valid_invoiced_so = False

    def _compute_fully_paid_so(self):
        for rec in self:
            rec.x_studio_fully_paid_so = False

    def _compute_user_location_validation(self):
        for rec in self:
            rec.x_studio_user_location_validation = False

    def _compute_stock_picking_count(self):
        for rec in self:
            rec.x_x_studio_created_from_help_ticket_stock_picking_count = 0

    # =========================================================================
    # TASK-27: Factory workflow actions
    # =========================================================================

    def action_send_to_factory(self):
        self.ensure_one()
        self.x_studio_send_to_factory = True
        stage = self.env['helpdesk.stage'].search(
            [('name', '=', 'SENT TO FACTORY')], limit=1)
        if stage:
            self.stage_id = stage

    def action_receive_at_factory(self):
        self.ensure_one()
        self.x_studio_receive_at_factory = True
        stage = self.env['helpdesk.stage'].search(
            [('name', '=', 'RECEIVED AT FACTORY')], limit=1)
        if stage:
            self.stage_id = stage

    def action_send_to_sales_centre(self):
        self.ensure_one()
        self.x_studio_send_to_centre = True
        stage = self.env['helpdesk.stage'].search(
            [('name', '=', 'SENT TO SALES CENTRE')], limit=1)
        if stage:
            self.stage_id = stage

    def action_receive_at_sales_centre(self):
        self.ensure_one()
        self.x_studio_receive_at_centre = True
        stage = self.env['helpdesk.stage'].search(
            [('name', '=', 'RECEIVED AT SALES CENTRE')], limit=1)
        if stage:
            self.stage_id = stage

    # =========================================================================
    # TASK-28: Cancel and reopen actions
    # =========================================================================

    def action_cancel_repair(self):
        self.ensure_one()
        self.x_studio_cancelled = True
        stage = self.env['helpdesk.stage'].search(
            [('name', '=', 'CANCELLED')], limit=1)
        if stage:
            self.x_studio_cancelled_stage_id = self.stage_id
            self.stage_id = stage
        self.x_studio_cancelled_by = self.env.user
        self.x_studio_cancelled_date = fields.Datetime.now()

    def action_cancel_repair_stage10(self):
        self.ensure_one()
        self.x_studio_cancelled_2 = True
        stage = self.env['helpdesk.stage'].search(
            [('name', '=', 'CANCELLED')], limit=1)
        if stage:
            self.x_studio_cancelled_stage_id = self.stage_id
            self.stage_id = stage

    def action_reopen_repair(self):
        self.ensure_one()
        self.x_studio_cancelled = False
        if self.x_studio_cancelled_stage_id:
            self.stage_id = self.x_studio_cancelled_stage_id
        self.x_studio_reopened_by = self.env.user
        self.x_studio_reopened_date = fields.Datetime.now()

    # =========================================================================
    # TASK-29: Repair creation actions
    # =========================================================================

    def action_change_type_to_rug(self):
        """Change ticket type to RUG (Repair Under Warranty - Confirmed).
        Searches for a ticket type where both x_studio_rug and x_studio_rug_confirmed are True.
        """
        self.ensure_one()
        rug_type = self.env['helpdesk.ticket.type'].search(
            [('x_studio_rug', '=', True), ('x_studio_rug_confirmed', '=', True)], limit=1)
        if rug_type:
            self.ticket_type_id = rug_type

    def action_update_serial(self):
        """Update the serial number flag and copy serial_no to serial_number field."""
        self.ensure_one()
        self.x_studio_sn_updated = True
        if self.x_studio_serial_no:
            self.x_studio_serial_number = self.x_studio_serial_no

    def action_create_repair_route(self):
        """Create repair route (stock picking) for without-serial repairs.
        Sets the repair_serial_created flag.
        TODO: Full implementation requires creating a stock.picking routed to the repair location.
        See studio_customization/data/ir_actions_server.xml — stub_action_1993.
        """
        self.ensure_one()
        self.x_studio_repair_serial_created = True

    def action_create_repair_serial(self):
        """Create repair serial number for without-serial repairs.
        Sets the repair_serial_created flag.
        TODO: Full implementation requires creating a stock.lot record and linking it.
        See studio_customization/data/ir_actions_server.xml — stub_action_1994.
        """
        self.ensure_one()
        self.x_studio_repair_serial_created = True
