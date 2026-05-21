frappe.provide("mobile_app.doctor_clinical");

const API = "mobile_app.mobileapp.page.doctor_clinical.doctor_clinical";
const CSS_PATH = "/assets/mobile_app/css/doctor_clinical.css";

function format_apt_time(val) {
	if (!val) return "";
	const s = String(val).trim();
	if (!s) return "";
	if (s.includes(" ") || s.includes("T")) {
		try {
			return frappe.datetime.str_to_user(s);
		} catch (e) {
			/* fall through */
		}
	}
	try {
		return moment(s, ["HH:mm:ss", "HH:mm", "h:mm A"], true).format("hh:mm A");
	} catch (e) {
		return s;
	}
}

function format_apt_date(val) {
	if (!val) return "";
	try {
		return frappe.datetime.str_to_user(val);
	} catch (e) {
		return String(val);
	}
}

function is_doctor_clinical_route(route) {
	if (mobile_app.doctor_clinical.is_doctor_clinical_route) {
		return mobile_app.doctor_clinical.is_doctor_clinical_route(route);
	}
	route = route || frappe.get_route() || [];
	return route[0] === "doctor-clinical";
}

function teardown_doctor_portal() {
	if (mobile_app.doctor_clinical.teardown_doctor_portal) {
		mobile_app.doctor_clinical.teardown_doctor_portal();
		return;
	}
	document.body.classList.remove("ma-doctor-portal-active");
	document.body.removeAttribute("data-route");
}

function leave_doctor_portal() {
	teardown_doctor_portal();
}

const NAV_ITEMS = [
	{ id: "dashboard", icon: "es-line-home", title: __("Dashboard") },
	{ id: "patients", icon: "es-line-users", title: __("Patients") },
	{ id: "appointments", icon: "es-line-calendar", title: __("Appointments") },
	{ id: "reports", icon: "es-line-file-text", title: __("Reports") },
	{ id: "settings", icon: "es-line-settings", title: __("Settings") },
];

function nav_icon_html(icon_name) {
	if (typeof frappe.utils.icon === "function") {
		return frappe.utils.icon(icon_name, "md");
	}
	return `<span class="ma-nav-icon-fallback" aria-hidden="true">•</span>`;
}

mobile_app.doctor_clinical.DoctorClinicalPortal = class DoctorClinicalPortal {
	constructor(wrapper) {
		this.wrapper = $(wrapper);
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: __("Doctor Clinical"),
			single_column: true,
		});
		this.$container = this.page.main;
		this.active_nav = "dashboard";
		this.wrapper.bind("show", () => this.on_route_change());
	}

	on_route_change() {
		document.body.classList.add("ma-doctor-portal-active");
		const route = frappe.get_route();
		if (route[1] === "appointment" && route[2]) {
			this.active_nav = "appointments";
			this.render_shell();
			this.load_appointment_view(route[2]);
		} else if (route[1] === "patients") {
			this.active_nav = "patients";
			this.render_shell();
			this.load_patients_view();
		} else if (route[1] === "patient" && route[2]) {
			this.active_nav = "patients";
			this.render_shell();
			this.open_patient_user(route[2]);
		} else {
			this.active_nav = "dashboard";
			this.render_shell();
			this.load_dashboard();
		}
	}

	render_shell() {
		const nav_items = [
			{ id: "dashboard", icon: "dashboard", title: __("Dashboard") },
			{ id: "patients", icon: "users", title: __("Patients") },
			{ id: "appointments", icon: "calendar", title: __("Appointments") },
			{ id: "reports", icon: "list", title: __("Reports") },
			{ id: "settings", icon: "setting-gear", title: __("Settings") },
		];

		const $nav = $('<ul class="ma-portal__nav"></ul>');
		nav_items.forEach((item) => {
			const $li = $('<li class="ma-portal__nav-item"></li>');
			const $btn = $(`<button type="button" class="ma-portal__nav-btn" title="${item.title}"></button>`);
			$btn.html(`<i class="icon-${item.icon}"></i>`);
			if (this.active_nav === item.id) $btn.addClass("is-active");
			$btn.on("click", () => this.navigate(item.id));
			$li.append($btn);
			$nav.append($li);
		});

		const $logout = $('<li class="ma-portal__nav-item"></li>').append(
			$(`<button type="button" class="ma-portal__nav-btn" title="${__("Logout")}"></button>`)
				.html('<i class="icon-logout"></i>')
				.on("click", () => frappe.app.logout())
		);

		this.$container
			.empty()
			.addClass("ma-portal-root")
			.html(
				`<div class="ma-portal">
					<aside class="ma-portal__sidebar">
						<div class="ma-portal__logo" title="Mobile App Clinical">+</div>
						<div class="ma-portal__nav-spacer"></div>
					</aside>
					<div class="ma-portal__main">
						<header class="ma-portal__header">
							<button type="button" class="ma-portal__back"></button>
							<div class="ma-portal__header-right">
								<span class="ma-portal__bell"><i class="icon-bell"></i></span>
								<div class="ma-portal__user">
									<img class="ma-portal__user-avatar" alt="" />
									<span class="ma-portal__user-name"></span>
									<span class="ma-portal__user-chevron">▼</span>
								</div>
							</div>
						</header>
						<div class="ma-portal__content"></div>
					</div>
				</div>`
			);

		// Fix accidental div from template — use div
		this.$container.find("div").each(function () {
			const $el = $(this);
			const $div = $("<div></div>").html($el.html());
			$.each(this.attributes, (_, attr) => $motion.attr(attr.name, attr.value));
			$el.replaceWith($div);
		});
		this.$container.find("div").replaceWith(function () {
			return $("<div></div>").attr("class", this.className).html(this.innerHTML);
		});

		const $sidebar = this.$container.find(".ma-portal__sidebar");
		$sidebar.find(".ma-portal__nav-spacer").before($nav);
		$nav.append($logout);

		this.$content = this.$container.find(".ma-portal__content");
		this.$back = this.$container.find(".ma-portal__back");
		this.$doctor_name = this.$container.find(".ma-portal__user-name");
		this.$doctor_img = this.$container.find(".ma-portal__user-avatar");

		this.$back
			.html(`<i class="icon-left"></i> ${__("Back to dashboard")}`)
			.off("click")
			.on("click", () => frappe.set_route("doctor-clinical"));

		const boot_user = frappe.boot?.user || {};
		this.set_doctor_header(
			frappe.session.user_fullname || boot_user.fullname || frappe.session.user,
			boot_user.image || boot_user.user_image
		);
	}

	set_doctor_header(name, image) {
		this.$doctor_name.text(name || __("Doctor"));
		if (image) {
			this.$doctor_img.attr("src", image).show();
		} else {
			this.$doctor_img.hide();
		}
	}

	navigate(section) {
		if (this.embedded) {
			if (section === "dashboard") {
				this._embedded_view = "dashboard";
				this._route_key = "";
				this.on_route_change();
			} else if (section === "patients") {
				this._embedded_view = "patients";
				this._route_key = "";
				this.on_route_change();
			} else if (section === "appointments") {
				leave_doctor_portal();
				frappe.set_route("List", "Mobile App Appointment");
			} else if (section === "reports") {
				leave_doctor_portal();
				frappe.set_route("List", "Mobile App User");
			} else if (section === "settings") {
				leave_doctor_portal();
				frappe.set_route("Form", "User", frappe.session.user);
			}
			return;
		}
		if (section === "dashboard") {
			frappe.set_route("doctor-clinical");
		} else if (section === "patients") {
			frappe.set_route("doctor-clinical", "patients");
		} else if (section === "appointments") {
			leave_doctor_portal();
			frappe.set_route("List", "Mobile App Appointment");
		} else if (section === "reports") {
			leave_doctor_portal();
			frappe.set_route("List", "Mobile App User");
		} else if (section === "settings") {
			leave_doctor_portal();
			frappe.set_route("Form", "User", frappe.session.user);
		}
	}

	set_loading() {
		this.$content.html(`<div class="ma-portal__loading">${__("Loading…")}</div>`);
	}

	load_dashboard() {
		this.$back.hide();
		this.set_loading();
		frappe
			.xcall(`${API}.get_dashboard`)
			.then((data) => {
				this.set_doctor_header(data.doctor_name, data.doctor_image);
				this.render_dashboard(data);
			})
			.catch((e) => this.show_error(e));
	}

	render_dashboard(data) {
		const today = data.today_appointments || [];
		const upcoming = data.upcoming_appointments || [];

		const $stats = $('<div class="ma-dash-grid"></div>');
		$stats.append(this.stat_card(data.patient_count, __("Active patients")));
		$stats.append(this.stat_card(today.length, __("Today's appointments")));
		$stats.append(this.stat_card(upcoming.length, __("Upcoming")));

		const $list = $('<div class="ma-appt-list"></div>');
		$list.append(
			$('<div class="ma-appt-list__head"></div>').text(
				`${__("Today's appointments")} — ${data.today_label}`
			)
		);

		if (!today.length) {
			$list.append(
				$('<div class="ma-empty-hint px-4 pb-3"></div>').text(
					__("No appointments scheduled for today.")
				)
			);
		} else {
			today.forEach((apt) => {
				$list.append(this.appointment_row(apt));
			});
		}

		this.$content.empty().append($('<h1 class="ma-portal__title"></h1>').text(__("Dashboard")));
		this.$content.append($stats).append($list);

		if (upcoming.length) {
			const $up = $('<div class="ma-appt-list mt-4"></div>');
			$up.append($('<div class="ma-appt-list__head"></div>').text(__("Upcoming")));
			upcoming.forEach((apt) => $up.append(this.appointment_row(apt, true)));
			this.$content.append($up);
		}
	}

	stat_card(value, label) {
		return $('<div class="ma-dash-stat"></div>')
			.append($('<div class="ma-dash-stat__value"></div>').text(String(value)))
			.append($('<div class="ma-dash-stat__label"></div>').text(label));
	}

	appointment_row(apt, show_date) {
		const time = apt.display_time || format_apt_time(apt.appointment_time);
		const date = apt.display_date || format_apt_date(apt.appointment_date);
		const meta = show_date
			? `${date} ${time}`.trim()
			: [time, apt.status].filter(Boolean).join(" · ");

		const $row = $('<div class="ma-appt-row"></div>');
		const $left = $("<div></div>");
		$left.append($('<div class="ma-appt-row__name"></div>').text(apt.patient_name || "—"));
		$left.append($('<div class="ma-appt-row__meta"></div>').text(meta));
		$row.append($left);
		if (apt.is_online) {
			$row.append($('<span class="ma-appt-row__badge"></span>').text(__("Online")));
		}
		$row.on("click", () => {
			if (this.embedded) {
				this._embedded_view = `appointment/${apt.name}`;
				this._route_key = "";
				this.on_route_change();
			} else {
				frappe.set_route("doctor-clinical", "appointment", apt.name);
			}
		});
		return $row;
	}

	load_patients_view() {
		this.$back.show();
		this.set_loading();
		frappe
			.xcall(`${API}.get_patients_list`, { limit: 50 })
			.then((data) => this.render_patients(data.patients || []))
			.catch((e) => this.show_error(e));
	}

	render_patients(patients) {
		const $search = $('<input type="text" class="form-control ma-patients-search" />').attr(
			"placeholder",
			__("Search patients…")
		);

		const $list = $('<div class="ma-appt-list"></div>');
		$list.append($('<div class="ma-appt-list__head"></div>').text(__("Patients")));

		const render_rows = (rows) => {
			$list.find(".ma-patient-list-item").remove();
			if (!rows.length) {
				$list.append(
					$('<div class="ma-empty-hint px-4 pb-3"></div>').text(__("No patients found."))
				);
				return;
			}
			rows.forEach((p) => {
				const $item = $('<div class="ma-patient-list-item"></div>');
				if (p.image) {
					$item.append(
						$(`<img class="ma-patient-list-item__avatar" src="${frappe.utils.escape_html(p.image)}" alt="" />`)
					);
				} else {
					const initials = (p.full_name || "?")
						.split(" ")
						.map((s) => s[0])
						.join("")
						.slice(0, 2)
						.toUpperCase();
					$item.append(
						$('<div class="ma-patient-list-item__avatar"></div>')
							.css({
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontWeight: 600,
								color: "#0f4c54",
							})
							.text(initials)
					);
				}
				const $text = $("<div></div>");
				$text.append($('<div class="ma-appt-row__name"></div>').text(p.full_name || p.name));
				$text.append(
					$('<div class="ma-appt-row__meta"></div>').text(
						[p.disease, p.gender, p.age != null ? `${p.age} yrs` : null].filter(Boolean).join(" · ")
					)
				);
				$item.append($text);
				$item.on("click", () => this.open_patient_user(p.name));
				$list.append($item);
			});
		};

		render_rows(patients);

		let timer;
		$search.on("input", () => {
			clearTimeout(timer);
			timer = setTimeout(() => {
				const q = $search.val();
				frappe
					.xcall(`${API}.get_patients_list`, { limit: 50, search: q || null })
					.then((data) => render_rows(data.patients || []));
			}, 300);
		});

		this.$content
			.empty()
			.append($('<h1 class="ma-portal__title"></h1>').text(__("Patients")))
			.append($search)
			.append($list);
	}

	open_patient_user(user_name) {
		frappe.set_route("Form", "Mobile App User", user_name);
	}

	load_appointment_view(appointment_name) {
		this.$back.show();
		this.set_loading();
		frappe
			.xcall(`${API}.get_appointment_chart`, { appointment_name })
			.then((data) => {
				this.set_doctor_header(data.doctor_name, data.doctor_image);
				this.render_appointment_view(data);
			})
			.catch((e) => this.show_error(e));
	}

	render_appointment_view(data) {
		const p = data.patient;
		const v = data.vitals;
		const apt = data.appointment;

		this.$content.empty();
		this.$content.append(
			$('<h1 class="ma-portal__title"></h1>').text(__("Current Appointment"))
		);

		if (apt.is_online && apt.google_meet_link) {
			const $bar = $('<div class="ma-meet-bar"></div>');
			$bar.append(
				$(`<a class="btn btn-primary btn-sm" target="_blank" rel="noopener">${__("Join Meeting")}</a>`).attr(
					"href",
					apt.google_meet_link
				)
			);
			$bar.append(
				$(`<button type="button" class="btn btn-default btn-sm">${__("Open appointment form")}</button>`).on(
					"click",
					() => frappe.set_route("Form", "Mobile App Appointment", apt.name)
				)
			);
			this.$content.append($bar);
		}

		const $grid = $('<div class="ma-chart-grid"></div>');
		const $left = $("<div></div>");
		const $right = $("<div></div>");

		// Patient profile card
		const $profile = $('<div class="ma-card ma-patient-card"></div>');
		if (p.image) {
			$profile.append(
				$(`<img class="ma-patient-card__avatar" alt="" src="${frappe.utils.escape_html(p.image)}" />`)
			);
		} else {
			const initials = (p.full_name || "?")
				.split(" ")
				.map((s) => s[0])
				.join("")
				.slice(0, 2)
				.toUpperCase();
			$profile.append($('<div class="ma-patient-card__initials"></div>').text(initials));
		}
		$profile.append($('<h2 class="ma-patient-card__name"></h2>').text(p.full_name || "—"));
		$profile.append(
			$('<p class="ma-patient-card__age"></p>').text(
				p.age != null ? `${__("Age")}: ${p.age}` : ""
			)
		);
		const $update = $(`<a class="ma-btn-update">${__("Update")}</a>`).attr(
			"href",
			`#`
		);
		$update.on("click", (e) => {
			e.preventDefault();
			leave_doctor_portal();
			frappe.set_route("Form", "Mobile App User", p.name);
		});
		$profile.append($update);
		$left.append($profile);

		// Information card
		const $info = $('<div class="ma-card ma-info-card"></div>');
		$info.append($('<h3 class="ma-info-card__title"></h3>').text(`${__("Information")}:`));
		const info_rows = [
			[__("Gender"), p.gender || "—"],
			[__("Blood Type"), p.blood_type || "—"],
			[__("Allergies"), p.allergies || "—"],
			[__("Diseases"), p.diseases || "—"],
			[__("Height"), p.height || "—"],
			[__("Weight"), p.weight || "—"],
			[__("Patient ID"), p.patient_id || "—"],
			[__("Last Visit"), p.last_visit || "—"],
		];
		info_rows.forEach(([label, value]) => {
			$info.append(
				$('<div class="ma-info-row"></div>')
					.append($('<span class="ma-info-row__label"></span>').text(label))
					.append($('<span class="ma-info-row__value"></span>').text(String(value)))
			);
		});
		$left.append($info);

		// Vitals row
		const $vitals = $('<div class="ma-vitals-row"></div>');
		$vitals.append(
			this.vital_card("heart", __("Heart Rate"), v.heart_rate, "ma-vital-mini__icon--heart", "♥")
		);
		$vitals.append(
			this.vital_card("temp", __("Body Temperature"), v.body_temperature, "ma-vital-mini__icon--temp", "🌡")
		);
		$vitals.append(
			this.vital_card(
				"glucose",
				__("Glucose"),
				v.glucose,
				"ma-vital-mini__icon--glucose",
				"💧"
			)
		);
		$right.append($vitals);

		// Test reports
		const $reports = $('<div class="ma-card"></div>');
		$reports.append($('<h3 class="ma-section-card__title"></h3>').text(__("Test Reports")));
		const reports = data.test_reports || [];
		if (!reports.length) {
			$reports.append(
				$('<p class="ma-empty-hint"></p>').text(__("No test reports synced from the mobile app yet."))
			);
		} else {
			reports.forEach((r) => {
				const $item = $('<div class="ma-report-item"></div>');
				$item.append($('<div class="ma-report-item__icon"></div>').html("📄"));
				const $text = $('<div class="ma-report-item__text"></div>');
				const $title = $('<div class="ma-report-item__title"></div>').text(r.title);
				if (r.file_url) {
					$title.wrapInner(
						$(`<a href="${frappe.utils.escape_html(r.file_url)}" target="_blank" rel="noopener"></a>`)
					);
				}
				$text.append($title);
				$text.append($('<div class="ma-report-item__date"></div>').text(r.date));
				$item.append($text);
				$reports.append($item);
			});
		}
		$right.append($reports);

		// Prescriptions
		const $rx = $('<div class="ma-card"></div>');
		$rx.append($('<h3 class="ma-section-card__title"></h3>').text(__("Prescriptions")));
		$rx.append(
			$(`<button type="button" class="ma-btn-add">+ ${__("Add a prescription")}</button>`).on(
				"click",
				() => {
					leave_doctor_portal();
					frappe.set_route("Form", "Mobile App User", p.name);
				}
			)
		);
		const rx_list = data.prescriptions || [];
		if (!rx_list.length) {
			$rx.append(
				$('<p class="ma-empty-hint"></p>').text(__("No prescriptions on file yet."))
			);
		} else {
			const $table = $('<table class="ma-rx-table"></table>');
			$table.append(
				$("<thead><tr><th></th><th></th><th></th></tr></thead>")
					.find("tr")
					.append($("<th></th>").text(__("Prescriptions")))
					.append($("<th></th>").text(__("Date")))
					.append($("<th></th>").text(__("Duration")))
					.parent()
			);
			const $tbody = $("<tbody></tbody>");
			rx_list.forEach((rx) => {
				const $tr = $("<tr></tr>");
				const $name = $('<td></td>').append(
					$('<div class="ma-rx-table__name"></div>')
						.append($('<span class="ma-rx-table__pill-icon"></span>').text("Rx"))
						.append(document.createTextNode(rx.title))
				);
				$tr.append($name);
				$tr.append($("<td></td>").text(rx.date));
				$tr.append($("<td></td>").text(rx.duration));
				$tbody.append($tr);
			});
			$table.append($tbody);
			$rx.append($table);
		}
		$right.append($rx);

		$grid.append($left).append($right);
		this.$content.append($grid);
	}

	vital_card(_id, label, value, icon_class, emoji) {
		return $('<div class="ma-vital-mini"></div>')
			.append(
				$(`<div class="ma-vital-mini__icon ${icon_class}"></div>`).text(emoji)
			)
			.append($('<div class="ma-vital-mini__label"></div>').text(label))
			.append($('<div class="ma-vital-mini__value"></div>').text(value || "—"));
	}

	show_error(err) {
		const msg = err?.message || err || __("Unable to load clinical view.");
		this.$content.html(`<div class="ma-portal__loading text-danger">${frappe.utils.escape_html(msg)}</div>`);
	}
};

// Fix div typos globally after load
$(document).ready(function () {
	const fix = () => {
		$(".ma-portal-root div").each(function () {
			const $d = $("<div></div>").attr("class", this.className).html(this.innerHTML);
			$(this).replaceWith($d);
		});
	};
	setTimeout(fix, 0);
});
