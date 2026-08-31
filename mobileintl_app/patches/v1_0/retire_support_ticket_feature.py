"""Permanently retire the Mobile App Support Ticket feature and its stored data."""

import frappe


SUPPORT_TICKET_DOCTYPES = (
	"App Support Ticket Message",
	"App Support Ticket",
	"Support Ticket Message",
	"Support Ticket",
)


def execute():
	# Remove legacy engagement rows before narrowing the Select options in the
	# child DocType. These rows duplicated ticket data and have no use afterward.
	if frappe.db.exists("DocType", "Mobile App Engagement Item"):
		frappe.db.delete("Mobile App Engagement Item", {"record_type": "Support Ticket"})

	# Remove ticket DocTypes in child-first order. Deleting the DocType also
	# removes its records, permissions, metadata, and database table.
	for doctype in SUPPORT_TICKET_DOCTYPES:
		if frappe.db.exists("DocType", doctype):
			frappe.delete_doc("DocType", doctype, ignore_permissions=True, force=True)

	if frappe.db.exists("Role", "Support Ticket API"):
		frappe.delete_doc("Role", "Support Ticket API", ignore_permissions=True, force=True)

	if frappe.db.exists("Workspace", "Mobile App"):
		workspace = frappe.get_doc("Workspace", "Mobile App")
		workspace.set(
			"shortcuts",
			[
				row
				for row in workspace.get("shortcuts") or []
				if row.link_to not in {"App Support Ticket", "Support Ticket"}
			],
		)
		workspace.save(ignore_permissions=True)

	frappe.clear_cache()
