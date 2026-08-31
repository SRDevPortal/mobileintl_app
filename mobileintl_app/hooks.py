app_name = "mobileintl_app"
app_title = "MobileApp"
app_publisher = "SRIAAS"
app_description = "Mobile app data storage"
app_email = "admin@example.com"
app_license = "mit"

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "mobileintl_app",
# 		"logo": "/assets/mobileintl_app/logo.png",
# 		"title": "MobileApp",
# 		"route": "/mobileintl_app",
# 		"has_permission": "mobileintl_app.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
app_include_css = [
	"/assets/mobileintl_app/css/mobile_app_clinical.css?v=20260525_dashboard_blank_fix",
	"/assets/mobileintl_app/css/doctor_clinical.css",
]
app_include_js = [
	"/assets/mobileintl_app/js/doctor_clinical_guard.js",
	"/assets/mobileintl_app/js/mobile_app_desk_utils.js",
	"/assets/mobileintl_app/js/mobile_app_workspace.js?v=20260525_dashboard_blank_fix",
]
# app_include_js = "/assets/mobileintl_app/js/mobileintl_app.js"

doctype_js = {
	"Mobile App User": [
		"public/js/mobile_app_clinical_ui.js",
		"public/js/mobile_app_user_form.js",
	],
	"Mobile App Appointment": "public/js/mobile_app_appointment.js",
}

doctype_list_js = {
	"Mobile App User": "public/js/mobile_app_user_list.js",
	"Mobile App Appointment": "public/js/mobile_app_appointment_list.js",
}

has_permission = {
	"Mobile App User": "mobileintl_app.mobileapp.doctype.mobile_app_user.mobile_app_user.has_permission",
}

# include js, css files in header of web template
# web_include_css = "/assets/mobileintl_app/css/mobileintl_app.css"
# web_include_js = "/assets/mobileintl_app/js/mobileintl_app.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "mobileintl_app/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "mobileintl_app/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "mobileintl_app.utils.jinja_methods",
# 	"filters": "mobileintl_app.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "mobileintl_app.install.before_install"
# after_install = "mobileintl_app.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "mobileintl_app.uninstall.before_uninstall"
# after_uninstall = "mobileintl_app.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "mobileintl_app.utils.before_app_install"
# after_app_install = "mobileintl_app.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "mobileintl_app.utils.before_app_uninstall"
# after_app_uninstall = "mobileintl_app.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "mobileintl_app.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

permission_query_conditions = {
	"Mobile App Appointment": "mobileintl_app.mobileapp.doctype.mobile_app_appointment.mobile_app_appointment.get_permission_query_conditions",
}
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"mobileintl_app.tasks.all"
# 	],
# 	"daily": [
# 		"mobileintl_app.tasks.daily"
# 	],
# 	"hourly": [
# 		"mobileintl_app.tasks.hourly"
# 	],
# 	"weekly": [
# 		"mobileintl_app.tasks.weekly"
# 	],
# 	"monthly": [
# 		"mobileintl_app.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "mobileintl_app.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "mobileintl_app.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Mobile App User": "mobileintl_app.mobileapp.doctype.mobile_app_user.mobile_app_user_dashboard.get_data",
# }
# Dashboard connections: mobile_app_user_dashboard.py (next to mobile_app_user.json) — get_data must accept data=None for meta loader and data=dict from hooks if used.

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["mobileintl_app.utils.before_request"]
# after_request = ["mobileintl_app.utils.after_request"]

# Job Events
# ----------
# before_job = ["mobileintl_app.utils.before_job"]
# after_job = ["mobileintl_app.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"mobileintl_app.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

# Translation
# ------------
# List of apps whose translatable strings should be excluded from this app's translations.
# ignore_translatable_strings_from = []
