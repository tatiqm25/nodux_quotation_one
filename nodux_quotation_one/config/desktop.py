# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from frappe import _

def get_data():
	return [
		# {
		# 	"module_name": "Nodux Quotation One",
		# 	"color": "grey",
		# 	"icon": "octicon octicon-file-directory",
		# 	"type": "module",
		# 	"hidden": 1
		# },

		{
			"module_name": "Quotation",
			"_doctype": "Nodux Quotation One",
			"color": "#f39c12",
			"icon": "octicon octicon-package",
			"type": "link",
			"link": "List/Nodux Quotation One"
		}
	]
