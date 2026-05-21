import frappe
from frappe import _


def get_data(data=None):
	"""Related tab is intentionally empty in single-doctype architecture."""
	data = frappe._dict(data or {})
	data.fieldname = "user_id"
	data.transactions = []
	return data
