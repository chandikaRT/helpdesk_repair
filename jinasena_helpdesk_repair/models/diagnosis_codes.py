from odoo import fields, models


class DiagnosisCodes(models.Model):
    _name = 'x_diagnosis_codes'
    _description = 'Diagnosis Codes'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _rec_name = 'x_name'
    _order = 'x_studio_sequence, id'

    x_name = fields.Char(string='Name', required=True)
    x_active = fields.Boolean(default=True, tracking=1)
    x_studio_sequence = fields.Integer(string='Sequence')
    x_studio_description = fields.Text(string='Description')
    x_studio_diagnosis_area_1 = fields.Many2one(
        'x_diagnosis_areas', string='Diagnosis Area', ondelete='set null')
    x_studio_company_id = fields.Many2one('res.company', string='Company', ondelete='set null')
