"""Permanently retire the Mobile App Support Ticket feature and its stored data."""

import frappe


APP_SUPPORT_TICKET_DOCTYPES = (
	"App Support Ticket Message",
	"App Support Ticket",
)


def execute():
	# Remove App ticket DocTypes in child-first order. Deleting the DocType also
	# removes its records, permissions, metadata, and database table.
	for doctype in APP_SUPPORT_TICKET_DOCTYPES:
		if frappe.db.exists("DocType", doctype):
			frappe.delete_doc("DocType", doctype, ignore_permissions=True, force=True)

	if frappe.db.exists("Workspace", "Mobile App"):
		workspace = frappe.get_doc("Workspace", "Mobile App")
		workspace.set(
			"shortcuts",
			[
				row
				for row in workspace.get("shortcuts") or []
				if row.link_to != "App Support Ticket"
			],
		)
		workspace.save(ignore_permissions=True)

	frappe.clear_cache()
