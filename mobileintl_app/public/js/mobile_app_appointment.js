// Mobile App Appointment — Google Meet (popup; Google blocks iframe embed)

const MEET_POPUP_TARGET = "mobile_app_google_meet";

function get_meet_url(doc) {
	return (doc.google_meet_link || doc.consultation_type || "").trim();
}

function is_safe_meet_url(url) {
	try {
		const parsed = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
		const host = parsed.hostname.toLowerCase();
		return host === "meet.google.com" || host.endsWith(".meet.google.com");
	} catch (e) {
		return false;
	}
}

function normalize_meet_url(url) {
	const trimmed = (url || "").trim();
	if (!trimmed) return "";
	return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, "")}`;
}

/** Google Meet cannot be iframed; open a centered popup beside Desk. */
function open_meet_popup(meet_url) {
	const normalized = normalize_meet_url(meet_url);
	if (!normalized) {
		frappe.msgprint(__("No Google Meet link is set for this appointment."));
		return null;
	}
	if (!is_safe_meet_url(normalized)) {
		frappe.msgprint(__("Consultation must contain a valid meet.google.com link."));
		return null;
	}

	const sw = window.screen?.availWidth || window.innerWidth;
	const sh = window.screen?.availHeight || window.innerHeight;
	const width = Math.min(1280, Math.floor(sw * 0.92));
	const height = Math.min(900, Math.floor(sh * 0.9));
	const left = Math.max(0, Math.floor((sw - width) / 2));
	const top = Math.max(0, Math.floor((sh - height) / 2));
	const features = [
		"popup=yes",
		`width=${width}`,
		`height=${height}`,
		`left=${left}`,
		`top=${top}`,
		"resizable=yes",
		"scrollbars=yes",
	].join(",");

	const win = window.open(normalized, MEET_POPUP_TARGET, features);
	if (!win) {
		frappe.msgprint({
			title: __("Popup blocked"),
			message: __(
				"Your browser blocked the meeting window. Allow popups for this site, or use <b>Join Meeting</b> to open in a new tab."
			),
			indicator: "orange",
		});
		window.open(normalized, "_blank", "noopener,noreferrer");
		return null;
	}
	try {
		win.focus();
	} catch (e) {
		/* cross-origin focus may fail */
	}
	return win;
}

function open_meet_launcher_dialog(meet_url) {
	const normalized = normalize_meet_url(meet_url);
	if (!normalized || !is_safe_meet_url(normalized)) {
		open_meet_popup(meet_url);
		return;
	}

	open_meet_popup(meet_url);

	const dialog = new frappe.ui.Dialog({
		title: __("Google Meet"),
		size: "large",
		fields: [
			{
				fieldtype: "HTML",
				fieldname: "meet_info",
				options: `<div class="mobile-app-meet-launcher">
					<p>${__(
						"Google does not allow Meet inside ERP (embedding is blocked). The meeting opens in a separate window next to Desk."
					)}</p>
					<p class="text-muted small mt-2">${__("Link")}: <a href="${frappe.utils.escape_html(
						normalized
					)}" target="_blank" rel="noopener noreferrer">${frappe.utils.escape_html(normalized)}</a></p>
				</div>`,
			},
		],
	});

	dialog.show();

	dialog.set_secondary_action_label(__("Close"));
	dialog.set_secondary_action(() => dialog.hide());

	dialog.set_primary_action(__("Reopen meeting window"), () => {
		open_meet_popup(meet_url);
	});
}

frappe.ui.form.on("Mobile App Appointment", {
	refresh(frm) {
		if (frm.is_new()) {
			return;
		}

		frm.add_custom_button(__("Clinical View"), () => {
			frappe.set_route("doctor-clinical", "appointment", frm.doc.name);
		}, __("Clinical"));

		const meet_url = get_meet_url(frm.doc);
		const online = frm.doc.is_online || is_safe_meet_url(meet_url);

		if (online && meet_url && is_safe_meet_url(meet_url)) {
			const open_url = normalize_meet_url(meet_url);

			frm.add_custom_button(__("Join Meeting"), () => {
				window.open(open_url, "_blank", "noopener,noreferrer");
			});

			frm.add_custom_button(__("Open Google Meet"), () => {
				open_meet_launcher_dialog(meet_url);
			});
		}

		if (!frm.doc.is_online && frm.doc.consultation_type) {
			frm.set_df_property("consultation_type", "read_only", 1);
		}
	},
});
