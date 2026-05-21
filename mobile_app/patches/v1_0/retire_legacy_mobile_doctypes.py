import frappe


LEGACY_DOCTYPES = (
	"Mobile App User Profile",
	"Mobile App User Session",
	"Mobile App Disease",
	"Mobile App User Disease Selection",
	"Mobile App Health Entry",
	"Mobile App Prescription",
	"Mobile App Doctor",
	"Mobile App Appointment",
	"Mobile App Notification",
	"Mobile App Support Ticket",
	"Mobile App Webhook Event",
)


def execute():
	"""Retire old standalone doctypes after moving to single-doctype architecture."""
	for dt in LEGACY_DOCTYPES:
		if frappe.db.exists("DocType", dt):
			frappe.delete_doc("DocType", dt, force=1, ignore_missing=True)
