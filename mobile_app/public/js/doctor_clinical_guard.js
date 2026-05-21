/* Tear down Doctor Clinical portal styles when leaving the route (browser back, workspace, etc.) */

frappe.provide("mobile_app.doctor_clinical");

function is_doctor_clinical_route(route) {
	route = route || frappe.get_route() || [];
	return route[0] === "doctor-clinical";
}

function teardown_doctor_portal() {
	document.body.classList.remove("ma-doctor-portal-active");
	document.body.removeAttribute("data-route");
	const portal = mobile_app.doctor_clinical?.portal;
	if (portal) {
		portal._route_key = "";
		if (portal.$container?.length) {
			portal.$container.removeClass("ma-portal-root").empty();
		}
	}
}

mobile_app.doctor_clinical.is_doctor_clinical_route = is_doctor_clinical_route;
mobile_app.doctor_clinical.teardown_doctor_portal = teardown_doctor_portal;

function sync_doctor_clinical_route_state() {
	if (!is_doctor_clinical_route()) {
		teardown_doctor_portal();
		return;
	}
	document.body.classList.add("ma-doctor-portal-active");
	document.body.setAttribute("data-route", frappe.get_route().join("/"));
}

if (!mobile_app.doctor_clinical._router_guard) {
	mobile_app.doctor_clinical._router_guard = true;
	if (frappe.router?.on) {
		frappe.router.on("change", sync_doctor_clinical_route_state);
	}
	$(document).on("page-change", sync_doctor_clinical_route_state);
}
