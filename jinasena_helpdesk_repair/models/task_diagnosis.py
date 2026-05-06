from odoo import fields, models


class TaskDiagnosis(models.Model):
    _name = 'x_task_diagnosis'
    _description = 'Task Diagnosis'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'x_studio_sequence, id'

    x_name = fields.Char(string='Name', required=True)
    x_active = fields.Boolean(default=True, tracking=1)
    x_studio_sequence = fields.Integer(string='Sequence')
    x_studio_description = fields.Text(string='Description')
    x_studio_condition = fields.Many2one('x_conditions', string='Condition', ondelete='set null')
    x_studio_diagnosis_area = fields.Many2one(
        'x_diagnosis_areas', string='Diagnosis Area', ondelete='set null')
    x_studio_diagnosis_code = fields.Many2one(
        'x_diagnosis_codes', string='Diagnosis Code', ondelete='set null')
    x_studio_reason = fields.Many2one('x_repair_reason', string='Reason', ondelete='set null')
    x_studio_sub_reason = fields.Many2one(
        'x_repair_sub_reason', string='Sub Reason', ondelete='set null')
    x_studio_resolution = fields.Many2one('x_resolutions', string='Resolution', ondelete='set null')
    x_studio_repair_stage = fields.Many2one(
        'x_repair_stages', string='Repair Stage', ondelete='set null')
    x_studio_task_id = fields.Many2one(
        'project.task', string='Task Id', ondelete='set null')
    x_studio_symptom_area = fields.Many2one(
        'x_symptom_areas', string='Symptom Area', ondelete='set null')
    x_studio_symptom_code = fields.Many2one(
        'x_symptom_codes', string='Symptom Code', ondelete='set null')
    x_studio_company_id = fields.Many2one('res.company', string='Company', ondelete='set null')
