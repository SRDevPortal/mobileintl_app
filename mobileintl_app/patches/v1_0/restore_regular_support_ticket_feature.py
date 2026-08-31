"""Restore the regular Support Ticket feature after retiring only its App variant."""

import frappe

from mobileintl_app.patches.v1_0.setup_support_ticket_api_permissions import (
	execute as setup_support_ticket_permissions,
)


def execute():
	setup_support_ticket_permissions()

	workspace = frappe.db.exists("Workspace", "Mobile App")
	if workspace:
		doc = frappe.get_doc("Workspace", workspace)
		changed = False
		for shortcut in doc.shortcuts:
			if shortcut.label == "Support Tickets":
				shortcut.type = "DocType"
				shortcut.link_to = "Support Ticket"
				changed = True
		if changed:
			doc.save(ignore_permissions=True)

	frappe.clear_cache()
