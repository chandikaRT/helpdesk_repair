from odoo import fields, models


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    x_studio_repair_reason = fields.Many2many(
        'x_repair_reason',
        'x_sale_order_x_repair_reason_rel',
        string='Repair Reason')
    x_studio_rug_approved = fields.Boolean(string='RUG Approved')
    x_studio_rug_rejected = fields.Boolean(string='RUG Rejected')
    x_studio_rug_request_sent = fields.Boolean(string='RUG Request Sent')
    x_studio_rug_confirmed = fields.Boolean(string='RUG Confirmed')
    x_studio_re_estimate_count = fields.Integer(string='Re-estimate Count')
    x_studio_re_estimate_request_count = fields.Integer(string='Re-estimate Request Count')
    x_studio_re_estimate_request_count_1 = fields.Integer(string='Re-estimate Request Count 1')
    x_studio_re_estimate_request_sent = fields.Boolean(string='Re-estimate Request Sent')
    x_studio_warranty_card = fields.Binary(string='Warranty Card')
