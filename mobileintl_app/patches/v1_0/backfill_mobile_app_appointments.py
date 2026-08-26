import frappe

from mobileintl_app.mobileapp.appointment_sync import backfill_all_appointments


def execute():
	"""Upsert standalone Mobile App Appointment from existing child rows."""
	if not frappe.db.exists("DocType", "Mobile App Appointment"):
		return
	count = backfill_all_appointments()
	frappe.logger().info("Mobile App Appointment backfill synced %s records", count)
