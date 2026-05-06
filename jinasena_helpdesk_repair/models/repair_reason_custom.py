from odoo import fields, models


class RepairReasonCustom(models.Model):
    _name = 'x_repair_reason_custom'
    _description = 'Repair Reason - Customer'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _rec_name = 'x_name'
    _order = 'x_studio_sequence, id'

    x_name = fields.Char(string='Name', required=True)
    x_active = fields.Boolean(default=True, tracking=1)
    x_color = fields.Integer(string='Color Index')
    x_studio_sequence = fields.Integer(string='Sequence')
    x_studio_company_id = fields.Many2one('res.company', string='Company', ondelete='set null')
