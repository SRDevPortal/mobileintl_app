"""Shared auth for Flutter / backend-erp style API (see project API.md)."""

import frappe
from frappe import _
from frappe.exceptions import AuthenticationError


def get_expected_app_token() -> str:
	return (frappe.conf.get("mobile_app_erp_token") or "").strip()


def get_request_app_token() -> str:
	token = (frappe.get_request_header("X-ERP-Token") or "").strip()
	if not token:
		auth = frappe.get_request_header("Authorization") or ""
		if auth.lower().startswith("bearer "):
			token = auth[7:].strip()
	return token


def require_app_token() -> None:
	"""Match backend-erp: 503 if unset, 401 if wrong/missing."""
	expected = get_expected_app_token()
	if not expected:
		frappe.local.response.http_status_code = 503
		frappe.throw(_("Mobile app ERP token is not configured (site_config: mobile_app_erp_token)"))

	token = get_request_app_token()
	if not token or token != expected:
		frappe.local.response.http_status_code = 401
		frappe.throw(_("Invalid or missing app token"), AuthenticationError)
