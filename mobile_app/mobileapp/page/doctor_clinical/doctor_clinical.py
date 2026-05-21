"""Doctor clinical portal — dashboard & current appointment chart API."""

from __future__ import annotations

import json
from datetime import date, datetime
from typing import Any

import frappe
from frappe import _
from frappe.utils import getdate, get_datetime


def _parse_json(raw: Any) -> list[dict]:
	if raw is None or raw == "":
		return []
	if isinstance(raw, list):
		return [r for r in raw if isinstance(r, dict)]
	if isinstance(raw, str):
		try:
			parsed = json.loads(raw)
		except json.JSONDecodeError:
			return []
		if isinstance(parsed, list):
			return [r for r in parsed if isinstance(r, dict)]
		if isinstance(parsed, dict):
			return [parsed]
		return []
	if isinstance(raw, dict):
		return [raw]
	return []


def _parse_profile_json(profile_row: dict | None) -> dict:
	if not profile_row:
		return {}
	raw = profile_row.get("profile_data_json")
	if not raw:
		return {}
	if isinstance(raw, dict):
		return raw
	if isinstance(raw, str):
		try:
			parsed = json.loads(raw)
			return parsed if isinstance(parsed, dict) else {}
		except json.JSONDecodeError:
			return {}
	return {}


def _health_map(user_doc) -> dict[str, dict]:
	out: dict[str, dict] = {}
	for row in user_doc.get("health_entries") or []:
		key = (row.get("tool_key") or "").strip()
		if key:
			out[key] = row
	return out


def _latest_entry(tool_row: dict | None) -> dict | None:
	logs = _parse_json(tool_row.get("data_json") if tool_row else None)
	if not logs:
		return None
	return logs[-1]


def _format_height(height) -> str | None:
	if height is None or height == "":
		return None
	try:
		h = float(height)
	except (TypeError, ValueError):
		return str(height)
	# Typical mobile profile: 150–220 = cm; 1.0–2.5 = metres; 30–99 = cm as stored
	if h >= 100:
		return f"{h / 100:.2f}m"
	if h >= 30:
		return f"{int(h) if h == int(h) else h} cm"
	if 1.0 <= h <= 2.5:
		return f"{h:.2f}m"
	return str(height)


def _format_weight(weight) -> str | None:
	if weight is None or weight == "":
		return None
	try:
		w = float(weight)
	except (TypeError, ValueError):
		return str(weight)
	return f"{int(w) if w == int(w) else w} kg"


def _format_display_date(value) -> str | None:
	if not value:
		return None
	if isinstance(value, (date, datetime)):
		return frappe.format(value, {"fieldtype": "Date"})
	try:
		return frappe.format(getdate(value), {"fieldtype": "Date"})
	except Exception:
		return str(value)


def _format_display_time(value) -> str:
	if not value:
		return ""
	if isinstance(value, datetime):
		return frappe.format(value.time(), {"fieldtype": "Time"})
	try:
		formatted = frappe.format(value, {"fieldtype": "Time"})
		if formatted and "Invalid" not in str(formatted):
			return formatted
	except Exception:
		pass
	return str(value).split(".")[0] if value else ""


def _enrich_appointment_row(row: dict) -> dict:
	row = dict(row)
	row["display_date"] = _format_display_date(row.get("appointment_date")) or ""
	row["display_time"] = _format_display_time(row.get("appointment_time"))
	return row


def _entry_sort_key(entry: dict) -> tuple:
	for key in ("logged_at", "timestamp", "date", "upload_date"):
		val = entry.get(key)
		if val is None or val == "":
			continue
		if isinstance(val, (int, float)):
			return (val,)
		try:
			if isinstance(val, str) and val.isdigit():
				return (int(val),)
			return (get_datetime(val),)
		except Exception:
			return (str(val),)
	return (0,)


def _report_title(entry: dict, fallback: str) -> str:
	for key in (
		"report_name",
		"test_name",
		"name",
		"valDisplay",
		"title",
		"kft_file",
		"cbc_file",
		"protein_file",
		"lft_thyroid_file",
	):
		val = entry.get(key)
		if val and str(val).strip():
			text = str(val).strip()
			if text.lower().endswith((".pdf", ".png", ".jpg", ".jpeg")):
				text = text.rsplit("/", 1)[-1]
			return text
	return fallback


def _report_date(entry: dict) -> str | None:
	for key in ("date", "upload_date", "logged_at"):
		val = entry.get(key)
		if not val:
			continue
		if isinstance(val, (int, float)):
			try:
				return frappe.format(
					datetime.fromtimestamp(val / 1000 if val > 1e12 else val),
					{"fieldtype": "Datetime"},
				)
			except Exception:
				pass
		formatted = _format_display_date(val)
		if formatted:
			return formatted
	return None


def _collect_test_reports(health: dict[str, dict]) -> list[dict]:
	items: list[dict] = []
	tools = [
		("lab_reports_data", "Lab Report"),
		("kft_reports_data", "KFT Report"),
		("cbc_reports_data", "CBC Report"),
	]
	for tool_key, label in tools:
		row = health.get(tool_key)
		if not row:
			continue
		for entry in _parse_json(row.get("data_json")):
			items.append(
				{
					"title": _report_title(entry, label),
					"date": _report_date(entry) or "—",
					"file_url": entry.get("kft_file_url")
					or entry.get("cbc_file_url")
					or entry.get("protein_file_url")
					or entry.get("lft_thyroid_file_url")
					or entry.get("file_url"),
					"tool_key": tool_key,
				}
			)
	items.sort(key=lambda r: r.get("date") or "", reverse=True)
	return items[:12]


def _collect_prescriptions(health: dict[str, dict]) -> list[dict]:
	row = health.get("prescriptions_data")
	if not row:
		return []
	items = []
	for entry in _parse_json(row.get("data_json")):
		title = (
			entry.get("valDisplay")
			or entry.get("doctor_name")
			or entry.get("clinic_name")
			or entry.get("type")
			or _("Prescription")
		)
		items.append(
			{
				"title": str(title).strip(),
				"date": _format_display_date(
					entry.get("date") or entry.get("upload_date") or entry.get("logged_at")
				)
				or "—",
				"duration": entry.get("duration") or entry.get("type") or "—",
				"file_url": entry.get("file_url"),
			}
		)
	items.sort(key=lambda r: r.get("date") or "", reverse=True)
	return items


def _last_visit(user_name: str, exclude: str | None = None) -> str | None:
	filters = {"mobile_app_user": user_name}
	if exclude:
		filters["name"] = ["!=", exclude]
	rows = frappe.get_all(
		"Mobile App Appointment",
		filters=filters,
		fields=["appointment_date"],
		order_by="appointment_date desc",
		limit=1,
	)
	if not rows or not rows[0].appointment_date:
		return None
	return _format_display_date(rows[0].appointment_date)


@frappe.whitelist()
def get_portal_branding():
	"""Company logo for clinical portal sidebar (Company → Navbar → app default)."""
	logo_url = None
	company_name = None

	company = frappe.defaults.get_user_default("Company") or frappe.db.get_single_value(
		"Global Defaults", "default_company"
	)
	if company and frappe.db.exists("Company", company):
		company_name = company
		logo_url = frappe.db.get_value("Company", company, "company_logo")

	if not logo_url:
		from frappe.core.doctype.navbar_settings.navbar_settings import get_app_logo

		logo_url = get_app_logo()

	if logo_url and not str(logo_url).startswith(("http://", "https://", "/")):
		logo_url = frappe.utils.get_url(logo_url)
	elif logo_url and str(logo_url).startswith("/"):
		logo_url = frappe.utils.get_url(logo_url)

	return {"logo_url": logo_url or "", "company_name": company_name or ""}


@frappe.whitelist()
def get_dashboard():
	"""Today's appointments and quick stats for the doctor portal home."""
	user = frappe.session.user
	today = getdate()

	filters: dict[str, Any] = {}
	if "Mobile App Doctor" in frappe.get_roles(user) and user != "Administrator":
		filters["doctor_user"] = user

	appointments = frappe.get_all(
		"Mobile App Appointment",
		filters={**filters, "appointment_date": today},
		fields=[
			"name",
			"patient_name",
			"appointment_time",
			"status",
			"mobile_app_user",
			"consultation_type",
			"is_online",
		],
		order_by="appointment_time asc, modified desc",
		limit=50,
	)

	upcoming = frappe.get_all(
		"Mobile App Appointment",
		filters={**filters, "appointment_date": [">", today]},
		fields=[
			"name",
			"patient_name",
			"appointment_date",
			"appointment_time",
			"status",
			"mobile_app_user",
		],
		order_by="appointment_date asc, appointment_time asc",
		limit=20,
	)

	patient_count = frappe.db.count("Mobile App User", {"is_active": 1})

	return {
		"doctor_name": frappe.utils.get_fullname(user) or user,
		"doctor_image": frappe.db.get_value("User", user, "user_image"),
		"today_appointments": [_enrich_appointment_row(a) for a in appointments],
		"upcoming_appointments": [_enrich_appointment_row(a) for a in upcoming],
		"patient_count": patient_count,
		"today_label": frappe.format(today, {"fieldtype": "Date"}),
	}


@frappe.whitelist()
def get_appointment_chart(appointment_name: str):
	"""Full patient chart payload for the Current Appointment screen."""
	if not appointment_name:
		frappe.throw(_("Appointment is required"))

	apt = frappe.get_doc("Mobile App Appointment", appointment_name)
	user_name = apt.mobile_app_user
	if not user_name:
		frappe.throw(_("This appointment has no linked patient."))

	user = frappe.get_doc("Mobile App User", user_name)
	profile = (user.profiles or [None])[0]
	profile_json = _parse_profile_json(profile)
	health = _health_map(user)

	bp = _latest_entry(health.get("bp_data"))
	sugar = _latest_entry(health.get("sugar_data"))

	heart_rate = None
	if bp and bp.get("pulse") is not None:
		heart_rate = f"{bp.get('pulse')} bpm"

	glucose = None
	if sugar and sugar.get("reading") is not None:
		glucose = f"{sugar.get('reading')} mg/dl"

	temperature = profile_json.get("body_temperature") or profile_json.get("temperature")
	if temperature is not None:
		temp_str = str(temperature)
		if "°" not in temp_str and "c" not in temp_str.lower():
			temp_str = f"{temp_str} °C"
		body_temperature = temp_str
	else:
		body_temperature = "—"

	diseases = (profile.disease if profile else None) or profile_json.get("disease")
	if profile_json.get("diseases"):
		diseases = profile_json.get("diseases")
	if isinstance(diseases, list):
		diseases = ", ".join(str(d) for d in diseases)

	allergies = profile_json.get("allergies") or profile_json.get("allergy")
	if isinstance(allergies, list):
		allergies = ", ".join(str(a) for a in allergies)

	image = user.image
	if image and not image.startswith(("http://", "https://", "/")):
		image = frappe.utils.get_url(image)

	return {
		"appointment": {
			"name": apt.name,
			"patient_name": apt.patient_name or user.full_name,
			"appointment_date": _format_display_date(apt.appointment_date),
			"appointment_time": apt.appointment_time,
			"status": apt.status,
			"consultation_type": apt.consultation_type,
			"is_online": apt.is_online,
			"google_meet_link": apt.google_meet_link,
			"doctor_name": apt.doctor_name,
		},
		"patient": {
			"name": user.name,
			"full_name": user.full_name or apt.patient_name,
			"image": image,
			"age": profile.age if profile else None,
			"gender": profile.gender if profile else None,
			"blood_type": profile_json.get("blood_type") or profile_json.get("blood_group"),
			"allergies": allergies or "—",
			"diseases": diseases or "—",
			"height": _format_height(profile.height if profile else None) or "—",
			"weight": _format_weight(profile.weight if profile else None) or "—",
			"patient_id": (profile.patient_id if profile else None)
			or user.external_id
			or user.name,
			"last_visit": _last_visit(user.name, exclude=apt.name) or "—",
			"phone": user.phone or (profile.phone if profile else None),
			"email": user.email or (profile.email if profile else None),
		},
		"vitals": {
			"heart_rate": heart_rate or "—",
			"body_temperature": body_temperature,
			"glucose": glucose or "—",
		},
		"test_reports": _collect_test_reports(health),
		"prescriptions": _collect_prescriptions(health),
		"doctor_name": frappe.utils.get_fullname(frappe.session.user) or frappe.session.user,
		"doctor_image": frappe.db.get_value("User", frappe.session.user, "user_image"),
	}


@frappe.whitelist()
def get_patients_list(limit: int = 40, start: int = 0, search: str | None = None):
	limit = min(int(limit or 40), 100)
	start = int(start or 0)
	filters: dict[str, Any] = {}
	or_filters = None
	if search:
		q = f"%{search.strip()}%"
		or_filters = [
			["full_name", "like", q],
			["email", "like", q],
			["phone", "like", q],
			["external_id", "like", q],
		]

	rows = frappe.get_all(
		"Mobile App User",
		filters=filters,
		or_filters=or_filters,
		fields=["name", "full_name", "email", "phone", "image", "is_active"],
		order_by="modified desc",
		limit_start=start,
		limit_page_length=limit,
	)

	for row in rows:
		if row.get("image") and not str(row["image"]).startswith(("http://", "https://", "/")):
			row["image"] = frappe.utils.get_url(row["image"])
		profiles = frappe.get_all(
			"Mobile App User Profile Item",
			filters={"parent": row.name, "parenttype": "Mobile App User"},
			fields=["disease", "age", "gender"],
			limit=1,
			order_by="idx asc",
		)
		if profiles:
			row.update(profiles[0])

	return {"patients": rows}
