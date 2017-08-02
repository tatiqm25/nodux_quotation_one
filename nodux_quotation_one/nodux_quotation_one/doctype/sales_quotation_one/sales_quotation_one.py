# -*- coding: utf-8 -*-
# Copyright (c) 2017, NODUX and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from frappe.utils import nowdate
from frappe import _
from frappe.model.mapper import get_mapped_doc

class SalesQuotationOne(Document):
	def before_save(self):
		self.docstatus = 1
		self.status = "Confirmed"
		# self.residual_amount = self.total
		# for item in self.items:
		# 	if item.item_code:
		# 		product = frappe.get_doc("Item", item.item_code)
		#
		# 		if product.total == None:
		# 			product.total = item.qty*(-1)
		# 			product.save()
		# 		else:
		# 			product.total = product.total-item.qty
		# 			product.save()
					# if product.total<0:
					# 	frappe.throw(("El producto {0} no se encuentra disponible en stock").format(item.item_name))
					# elif product.total < item.qty:
					# 	frappe.throw(("No cuenta con suficiente stock del producto {0}").format(item.item_name))
					# else:
					# 	product.total = product.total-item.qty
					# 	product.save()

	def update_to_anulled_quotation(self):
		#agregar permisos de usuario
		for line in self.items:
			product = frappe.get_doc("Item", line.item_code)
			if product.total == None:
				product.total = line.qty
			else:
				product.total = product.total + line.qty
				product.save()
		self.status="Anulled"
		self.save()

	def get_item_details_quotation(self, args=None, for_update=False):
		item = frappe.db.sql("""select stock_uom, description, image, item_name,
			list_price, list_price_with_tax, barcode, tax from `tabItem`
			where name = %s
				and disabled=0
				and (end_of_life is null or end_of_life='0000-00-00' or end_of_life > %s)""",
			(args.get('item_code'), nowdate()), as_dict = 1)
		if not item:
			frappe.throw(_("Item {0} is not active or end of life has been reached").format(args.get("item_code")))

		item = item[0]

		ret = {
			'uom'			      	: item.stock_uom,
			'description'		  	: item.description,
			'item_name' 		  	: item.item_name,
			'qty'					: 1,
			'barcode'				: item.barcode,
			'unit_price'			: item.list_price,
			'unit_price_with_tax'	: item.list_price_with_tax,
			'subtotal'				: item.list_price_with_tax
		}

		#update uom

		if args.get("uom") and for_update:
			ret.update(get_uom_details(args.get('item_code'), args.get('uom'), args.get('qty')))

		return ret

	def get_prices(self):
		base_imponible = 0
		for line in self.items:
			if line.subtotal:
				base_imponible += line.subtotal
		self.base_imponible = base_imponible

	def update_prices_quotation(self, args=None, for_update=False):
		item = frappe.db.sql("""select tax from `tabItem`
			where name = %s
				and disabled=0
				and (end_of_life is null or end_of_life='0000-00-00' or end_of_life > %s)""",
			(args.get('item_code'), nowdate()), as_dict = 1)

		item = item[0]

		if args.get("qty") and args.get("unit_price"):
			qty = args.get("qty")
			unit_price = args.get("unit_price")

			if item.tax == "IVA 0%":
				unit_price_with_tax = unit_price
				subtotal = qty * unit_price
			elif item.tax == "IVA 12%":
				unit_price_with_tax= unit_price * (1.12)
				subtotal = unit_price_with_tax * qty
			elif item.tax == "IVA 14%":
				unit_price_with_tax = unit_price * (1.14)
				subtotal = unit_price_with_tax * qty
			elif item.tax == "No aplica impuestos":
				unit_price_with_tax = unit_price
				subtotal = qty * unit_price

		ret = {
			'subtotal'				: subtotal,
			'unit_price_with_tax'	: unit_price_with_tax
		}

		return ret

	def get_item_code_quotation(self, args=None, serial_no=None):
		item = frappe.db.sql("""select stock_uom, description, image, item_name,
			list_price, name, list_price_with_tax from `tabItem`
			where barcode = %s
				and disabled=0
				and (end_of_life is null or end_of_life='0000-00-00' or end_of_life > %s)""",
			(args.get('barcode'), nowdate()), as_dict = 1)

		if not item:
			frappe.throw(_("No existe producto con codigo de barra {0}").format(args.get("barcode")))

		item = item[0]

		ret = {
			'uom'			      	: item.stock_uom,
			'description'		  	: item.description,
			'item_name' 		  	: item.item_name,
			'item_code'				: item.name,
			'qty'					: 1,
			'unit_price'			: item.list_price,
			'unit_price_with_tax'	: item.list_price_with_tax,
			'subtotal'				: item.list_price_with_tax
		}

		return ret


@frappe.whitelist()
def update_to_done_quotation(source_name, target_doc=None):
	def postprocess(source, target):
		target.docstatus = 0
		target.status = "Draft"

	def update_item(obj, target, source_parent):

		target.customer = obj.customer
		target.customer_name = obj.customer
		target.base_imponible = obj.base_imponible
		target.total_taxes = obj.total_taxes
		target.posting_date = obj.posting_date
		target.company = obj.company
		target.items = obj.items
		target.total = obj.total
		obj.status = "Done"
		obj.save()

	doc = get_mapped_doc("Sales Quotation One", source_name,	{
		"Sales Quotation One": {
			"doctype": "Sales Invoice One",
			"validation": {
				"docstatus": ["=", 1],
			},
			"postprocess": update_item
		}
	}, target_doc, postprocess)

	return doc

	# def set_missing_values(source, target):
