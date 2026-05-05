from odoo import fields, models


class RepairAccounts(models.Model):
    _name = 'x_repair_accounts'
    _description = 'Repair Accounts'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'x_studio_sequence, id'

    x_name = fields.Char(string='Name', required=True)
    x_active = fields.Boolean(default=True, tracking=1)
    x_studio_sequence = fields.Integer(string='Sequence')
    x_studio_rug_account = fields.Many2one(
        'account.account', string='RUG Account', ondelete='set null')
    x_studio_company_id = fields.Many2one('res.company', string='Company', ondelete='set null')
