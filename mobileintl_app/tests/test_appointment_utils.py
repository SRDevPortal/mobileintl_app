# Copyright (c) 2026, SRIAAS and contributors

import unittest

from mobileintl_app.mobileapp.appointment_utils import (
	OPD_CONSULTATION_LABEL,
	apply_consultation_rules,
	is_google_meet_url,
	is_opd_consultation,
	normalize_meet_url,
)


class _Doc:
	def __init__(self, consultation_type=None, payload_json=None):
		self.consultation_type = consultation_type
		self.payload_json = payload_json
		self.is_online = 0
		self.google_meet_link = None


class TestAppointmentUtils(unittest.TestCase):
	def test_meet_url_detection(self):
		self.assertTrue(is_google_meet_url("https://meet.google.com/abc-defg-hij"))
		self.assertFalse(is_google_meet_url("OPD Consultation"))

	def test_normalize_meet_url(self):
		self.assertEqual(
			normalize_meet_url("meet.google.com/abc-defg-hij"),
			"https://meet.google.com/abc-defg-hij",
		)

	def test_online_consultation(self):
		doc = _Doc("https://meet.google.com/xyz-abcd-efg")
		apply_consultation_rules(doc)
		self.assertEqual(doc.is_online, 1)
		self.assertIn("meet.google.com", doc.google_meet_link)

	def test_opd_consultation(self):
		doc = _Doc("OPD")
		apply_consultation_rules(doc)
		self.assertEqual(doc.is_online, 0)
		self.assertEqual(doc.consultation_type, OPD_CONSULTATION_LABEL)
		self.assertTrue(is_opd_consultation(doc.consultation_type))


if __name__ == "__main__":
	unittest.main()
