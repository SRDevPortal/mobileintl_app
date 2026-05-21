/* Shared Desk helpers for Mobile App User (doctor-facing restrictions) */

frappe.provide("mobile_app.desk");

mobile_app.desk.is_mobile_app_admin = function () {
	return frappe.user.has_role("System Manager") || frappe.user.name === "Administrator";
};

/** Tabs that hold mobile-sync child tables — not for clinical review in Desk */
mobile_app.desk.SYNC_TAB_FIELDS = ["profiles_tab", "sessions_tab", "engagement_tab"];

mobile_app.desk.SYNC_TABLE_FIELDS = ["profiles", "sessions", "engagement_items"];

mobile_app.desk.apply_doctor_desk_restrictions = function (frm) {
	if (!frm || frm.doctype !== "Mobile App User") return;
	if (mobile_app.desk.is_mobile_app_admin()) return;

	frm.$wrapper.addClass("ma-doctor-user-form");

	mobile_app.desk.SYNC_TAB_FIELDS.forEach((fieldname) => {
		if (frm.fields_dict[fieldname]) {
			frm.set_df_property(fieldname, "hidden", 1);
		}
	});

	mobile_app.desk.SYNC_TABLE_FIELDS.forEach((fieldname) => {
		const grid = frm.fields_dict[fieldname]?.grid;
		if (!grid) return;
		grid.cannot_add_rows = true;
		grid.wrapper.find(".grid-add-row, .grid-remove-rows").hide();
	});

	// Identity fields synced from the mobile app — read-only for doctors
	["external_id", "supabase_user_id", "email", "phone", "created_at", "updated_at"].forEach(
		(fieldname) => {
			if (frm.fields_dict[fieldname]) {
				frm.set_df_property(fieldname, "read_only", 1);
			}
		}
	);

	mobile_app.desk.hide_create_actions(frm);
};

mobile_app.desk.hide_create_actions = function (frm) {
	if (mobile_app.desk.is_mobile_app_admin()) return;

	if (frm.page) {
		frm.page.inner_toolbar?.find(".btn-new-doc").hide();
	}

	$(document.body)
		.find('.dropdown-item[data-label="New"], .dropdown-item[data-label*="Mobile App User"]')
		.closest("li")
		.hide();
};

mobile_app.desk.block_new_patient_route = function (frm) {
	if (!frm?.is_new() || mobile_app.desk.is_mobile_app_admin()) return false;

	frappe.msgprint({
		title: __("Not allowed"),
		message: __(
			"Patients are registered from the SRIAAS mobile app. You cannot create a Mobile App User from ERP."
		),
		indicator: "orange",
	});

	frappe.set_route("List", "Mobile App User");
	return true;
};
