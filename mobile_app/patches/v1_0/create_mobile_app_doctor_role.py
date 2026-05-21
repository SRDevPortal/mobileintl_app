import frappe


def execute():
	"""Ensure Mobile App Doctor role exists for appointment list permissions."""
	if not frappe.db.exists("Role", "Mobile App Doctor"):
		role = frappe.get_doc(
			{
				"doctype": "Role",
				"role_name": "Mobile App Doctor",
				"desk_access": 1,
			}
		)
		role.insert(ignore_permissions=True)
