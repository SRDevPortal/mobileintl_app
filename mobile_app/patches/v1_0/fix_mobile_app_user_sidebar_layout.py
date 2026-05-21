import frappe
from frappe.utils import cint


def execute():
	"""Two-column form needs hide_toolbar=0; avatar needs image_field=image (see form.js make_app_page)."""
	name = "Mobile App User"
	if not frappe.db.exists("DocType", name):
		return
	dt = frappe.get_doc("DocType", name)
	changed = False
	if cint(dt.hide_toolbar):
		dt.hide_toolbar = 0
		changed = True
	if getattr(dt, "image_field", None) != "image":
		dt.image_field = "image"
		changed = True
	if changed:
		dt.save(ignore_permissions=True)
	frappe.clear_cache(doctype=name)
