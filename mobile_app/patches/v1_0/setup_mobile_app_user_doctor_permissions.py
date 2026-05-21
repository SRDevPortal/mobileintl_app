"""Desk permissions: doctors can open patients but cannot create/delete Mobile App User."""

import frappe
from frappe.permissions import add_permission, update_permission_property


def execute():
	if not frappe.db.exists("Role", "Mobile App Doctor"):
		return

	dt = "Mobile App User"
	if not frappe.db.exists("DocType", dt):
		return

	perm_name = frappe.db.get_value(
		"Custom DocPerm",
		{"parent": dt, "role": "Mobile App Doctor", "permlevel": 0},
		"name",
	)
	if not perm_name:
		perm_name = frappe.db.get_value(
			"DocPerm",
			{"parent": dt, "role": "Mobile App Doctor", "permlevel": 0},
			"name",
		)

	if not perm_name:
		add_permission(dt, "Mobile App Doctor", 0)
		perm_name = frappe.db.get_value(
			"Custom DocPerm",
			{"parent": dt, "role": "Mobile App Doctor", "permlevel": 0},
			"name",
		) or frappe.db.get_value(
			"DocPerm",
			{"parent": dt, "role": "Mobile App Doctor", "permlevel": 0},
			"name",
		)

	if perm_name:
		for prop, val in (
			("read", 1),
			("write", 1),
			("create", 0),
			("delete", 0),
			("export", 1),
			("print", 1),
			("email", 1),
			("report", 1),
			("share", 0),
		):
			update_permission_property(dt, "Mobile App Doctor", 0, prop, val)

	frappe.clear_cache()
