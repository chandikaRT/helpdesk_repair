from odoo import api, models


class HelpdeskTeam(models.Model):
    _inherit = 'helpdesk.team'

    @api.model
    def _init_teams(self):
        """Enable product returns on the default Customer Care team."""
        team = self.search([('name', '=', 'Customer Care')], limit=1)
        if team:
            team.write({'use_product_returns': True})
