"""Move legacy Health Entry rows from medical_items → health_entries child table."""

import json

import frappe


def _parse_payload(payload):
	if not payload:
		return None
	if isinstance(payload, dict):
		return payload
	if isinstance(payload, str):
		try:
			return frappe.parse_json(payload)
		except Exception:
			return None
	return None


def execute():
	if not frappe.db.exists("DocType", "Mobile App Health Entry Item"):
		return

	for name in frappe.get_all("Mobile App User", pluck="name"):
		doc = frappe.get_doc("Mobile App User", name)
		by_tool = {row.tool_key: row for row in (doc.health_entries or []) if row.tool_key}

		changed = False
		for row in doc.medical_items or []:
			if str(row.record_type or "").strip() != "Health Entry":
				continue

			payload = _parse_payload(row.payload_json) or {}
			tool_key = (
				payload.get("tool_key")
				or row.title
				or payload.get("toolKey")
			)
			if not tool_key:
				continue
			tool_key = str(tool_key).strip()

			entry = {
				"doctype": "Mobile App Health Entry Item",
				"tool_key": tool_key,
				"entry_id": payload.get("entry_id") or row.record_external_id,
				"entry_timestamp": row.recorded_at,
				"source": payload.get("source") or "app",
				"score": payload.get("score"),
				"is_deleted": payload.get("is_deleted") or 0,
				"data_json": payload.get("data_json") or payload.get("data") or payload,
			}

			if tool_key in by_tool:
				existing = by_tool[tool_key]
				for key, val in entry.items():
					if key != "doctype" and val is not None:
						setattr(existing, key, val)
			else:
				doc.append("health_entries", entry)
				by_tool[tool_key] = doc.health_entries[-1]
			changed = True

		if changed:
			doc.flags.ignore_permissions = True
			doc.save()
