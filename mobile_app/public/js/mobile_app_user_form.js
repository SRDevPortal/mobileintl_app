// Mobile App User — clinical doctor-facing form UI + sidebar avatar

const LIVE_POLL_MS = 12000;
const CLINICAL_CSS = "/assets/mobile_app/css/mobile_app_clinical.css";

function clear_live_poll(frm) {
	if (frm._ma_live_poll) {
		clearInterval(frm._ma_live_poll);
		frm._ma_live_poll = null;
	}
}

function route_matches_frm(frm) {
	const r = frappe.get_route();
	return r && r[0] === "Form" && r[1] === frm.doctype && String(r[2]) === String(frm.docname);
}

function start_live_poll(frm) {
	clear_live_poll(frm);
	if (frm.is_new()) return;

	frm._ma_live_poll = setInterval(() => {
		if (!frm.doc || frm.is_dirty()) return;
		if (!route_matches_frm(frm)) {
			clear_live_poll(frm);
			return;
		}
		frappe.db.get_value(frm.doctype, { name: frm.docname }, "modified", (row) => {
			if (!row?.modified || !frm.doc) return;
			if (row.modified !== frm.doc.modified) {
				frm.reload_doc().then(() => {
					frappe.show_alert({ message: __("Record updated"), indicator: "green" }, 3);
				});
			}
		});
	}, LIVE_POLL_MS);
}

function setup_sidebar(frm) {
	if (!frappe.boot.desk_settings.form_sidebar || !frm.sidebar) return;

	const img = frm.fields_dict.image;
	if (img?.df?.fieldtype === "Attach Image" && !frm.meta.image_field) {
		frm.meta.image_field = "image";
	}

	if (frm.page?.sidebar?.length) {
		frm.page.sidebar.removeClass("hide-sidebar").show();
	}

	const $wrap = frm.sidebar.sidebar;
	if ($wrap?.length) $wrap.removeClass("hidden-xs hidden-sm");

	if (frm.meta.image_field && frm.sidebar.image_section?.length) {
		frm.sidebar.image_section.removeClass("hide");
	}

	if (frm.meta.image_field) frappe.ui.form.set_user_image(frm);
}

function setup_clinical_ui(frm) {
	if (frm.is_new() || !mobile_app.clinical_ui) return;
	mobile_app.clinical_ui.setup(frm);
}

frappe.ui.form.on("Mobile App User", {
	onload(frm) {
		frappe.require(CLINICAL_CSS);

		if (mobile_app.desk?.block_new_patient_route?.(frm)) {
			return;
		}
	},

	refresh(frm) {
		clear_live_poll(frm);

		if (frm.is_new()) {
			mobile_app.desk?.block_new_patient_route?.(frm);
			return;
		}

		if (mobile_app.desk?.apply_doctor_desk_restrictions) {
			mobile_app.desk.apply_doctor_desk_restrictions(frm);
		}

		start_live_poll(frm);
		setup_sidebar(frm);
		setup_clinical_ui(frm);
	},

	medical_tab(frm) {
		setTimeout(() => {
			if (mobile_app.clinical_ui) {
				mobile_app.clinical_ui.render_medical_summary(frm);
			}
		}, 80);
	},

	health_entries_tab(frm) {
		setTimeout(() => {
			if (mobile_app.clinical_ui) {
				mobile_app.clinical_ui.render_health_workspace(frm);
			}
		}, 80);
	},

	after_save(frm) {
		setup_clinical_ui(frm);
	},
});
