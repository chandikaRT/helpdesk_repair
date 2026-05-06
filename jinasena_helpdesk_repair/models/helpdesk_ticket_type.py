from odoo import api, fields, models


class HelpdeskTicketType(models.Model):
    _inherit = 'helpdesk.ticket.type'

    x_studio_rug = fields.Boolean(string='Repair Under Warranty (RUG)')
    x_studio_rug_confirmed = fields.Boolean(string='RUG Confirmed')
    x_studio_with_serial_no = fields.Boolean(string='With Serial No')
    x_studio_without_serial_no = fields.Boolean(string='Without Serial No')

    @api.model
    def _init_ticket_types(self):
        """Set correct boolean flags on ticket types created via Studio."""
        updates = [
            ('Repair - Under Warranty - RUG', {
                'x_studio_rug': True,
                'x_studio_rug_confirmed': True,
                'x_studio_with_serial_no': False,
                'x_studio_without_serial_no': False,
            }),
            ('Repair - Under Warranty - External not RUG', {
                'x_studio_rug': False,
                'x_studio_rug_confirmed': False,
                'x_studio_with_serial_no': True,
                'x_studio_without_serial_no': False,
            }),
            ('Repair - Not Under Warranty (With Serial No)', {
                'x_studio_with_serial_no': True,
                'x_studio_without_serial_no': False,
            }),
            ('Repair - Not Under Warranty (Without Serial No)', {
                'x_studio_with_serial_no': False,
                'x_studio_without_serial_no': True,
            }),
        ]
        for name, vals in updates:
            rec = self.search([('name', '=', name)], limit=1)
            if rec:
                rec.write(vals)
