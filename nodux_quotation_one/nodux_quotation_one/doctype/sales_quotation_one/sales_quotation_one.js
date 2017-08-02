// Copyright (c) 2017, NODUX and contributors
// For license information, please see license.txt
frappe.provide("nodux_quotation_one.nodux_quotation_one");

frappe.ui.form.on('Sales Quotation One', {
	// refresh: function(frm) {
	// 	if (frm.doc.status == 'Confirmed' && frm.doc.docstatus=='1') {
	// 		frm.add_custom_button(__("Make Sale"), function() {
	// 			frm.events.update_to_done_quotation(frm);
	// 		}).addClass("btn-primary");
	// 	}
	//
	// 	if(frm.doc.status == 'Confirmed' && frm.doc.docstatus == '1' ) {
	// 			frm.add_custom_button(__('Sale'), this.update_to_done_quotation, __("Make"));
	// 		}
	//
	// 	if (frm.doc.status == 'Done' && frm.doc.docstatus=='1') {
	// 		frm.add_custom_button(__("Anulled"), function() {
	// 			frm.events.update_to_anulled_quotation(frm);
	// 		}).addClass("btn-primary");
	// 	}
	// 	frm.refresh_fields();
	// },

	customer: function(frm) {
		if (frm.doc.customer){
			frm.set_value("customer_name", frm.doc.customer);
		}
		frm.refresh_fields();
	},

	// update_to_done_quotation: function(frm) {
	// 	return frappe.call({
	// 		doc: frm.doc,
	// 		method: "update_to_done_quotation",
	// 		freeze: true,
	// 		callback: function(r) {
	// 			frm.refresh_fields();
	// 			frm.refresh();
	// 		}
	// 	})
	// },
	update_to_done_quotation: function() {
		alert("ingresa");
		frappe.model.open_mapped_doc({
			method: "nodux_quotation_one.nodux_quotation_one.sales_quotation_one.update_to_done_quotation",
			frm: frm
		})
	},

	update_to_anulled_quotation: function(frm) {
		return frappe.call({
			doc: frm.doc,
			method: "update_to_anulled_quotation",
			freeze: true,
			callback: function(r) {
				frm.refresh_fields();
				frm.refresh();
			}
		})
	},

})

nodux_quotation_one.nodux_quotation_one.SalesQuotationOne = frappe.ui.form.Controller.extend({
	refresh: function(doc, dt, dn) {
		if((doc.status == 'Confirmed') && (doc.docstatus=1)) {
				cur_frm.add_custom_button(__('Sale'), this.update_to_done_quotation, __("Make"));
			}

	},

	update_to_done_quotation: function() {
		frappe.model.open_mapped_doc({
			method: "nodux_quotation_one.nodux_quotation_one.doctype.sales_quotation_one.sales_quotation_one.update_to_done_quotation",
			frm: cur_frm
		})
	},

});

$.extend(cur_frm.cscript, new nodux_quotation_one.nodux_quotation_one.SalesQuotationOne ({frm: cur_frm}));

frappe.ui.form.on('Sales Quotation Item', {
	item_name: function(frm, cdt, cdn) {
		var item = frappe.get_doc(cdt, cdn);
		if(!item.item_name) {
			item.item_name = "";
		} else {
			item.item_name = item.item_name;
		}
	},

	barcode: function(frm, cdt, cdn) {
		var d = locals[cdt][cdn];
		if(d.barcode) {
			args = {
				'barcode'			: d.barcode
			};
			return frappe.call({
				doc: cur_frm.doc,
				method: "get_item_code_quotation",
				args: args,
				callback: function(r) {
					if(r.message) {
						var d = locals[cdt][cdn];
						$.each(r.message, function(k, v) {
							d[k] = v;
						});
						refresh_field("items");
						cur_frm.refresh_fields();
						calculate_base_imponible(frm);
					}
				}
			});
		}
		cur_frm.refresh_fields();
	},

	item_code: function(frm, cdt, cdn) {
		var d = locals[cdt][cdn];
		var base_imponible = 0;
		var total_taxes = 0;
		var total = 0;
		var doc = frm.doc;

		if(d.item_code) {
			args = {
				'item_code'			: d.item_code,
				'qty'				: d.qty
			};
			return frappe.call({
				doc: cur_frm.doc,
				method: "get_item_details_quotation",
				args: args,
				callback: function(r) {
					if(r.message) {
						var d = locals[cdt][cdn];
						$.each(r.message, function(k, v) {
							d[k] = v;
						});
						refresh_field("items");
						cur_frm.refresh_fields();
						calculate_base_imponible(frm)
					}
				}
			});

			frm.refresh_fields();
		}
	},

	qty: function(frm, cdt, cdn) {
		var d = locals[cdt][cdn];
		if(d.qty) {
			args = {
				'item_code'			: d.item_code,
				'qty'				: d.qty,
				'unit_price': d.unit_price
			};
			return frappe.call({
				doc: cur_frm.doc,
				method: "update_prices_quotation",
				args: args,
				callback: function(r) {
					if(r.message) {
						var d = locals[cdt][cdn];
						$.each(r.message, function(k, v) {
							d[k] = v;
						});
						refresh_field("items");
						cur_frm.refresh_fields();
						calculate_base_imponible(frm);
					}
				}
			});
		}
	},

	unit_price: function(frm, cdt, cdn){
		// if user changes the rate then set margin Rate or amount to 0
		var d = locals[cdt][cdn];
		if(d.item_code){
			args = {
				'item_code'			: d.item_code,
				'qty'				: d.qty,
				'unit_price': d.unit_price
			};
			return frappe.call({
				doc: cur_frm.doc,
				method: "update_prices_quotation",
				args: args,
				callback: function(r) {
					if(r.message) {
						var d = locals[cdt][cdn];
						$.each(r.message, function(k, v) {
							d[k] = v;
						});
						refresh_field("items");
						cur_frm.refresh_fields();
						calculate_base_imponible(frm);
					}
				}
			});
		}
	}
})

var calculate_base_imponible = function(frm) {
	var doc = frm.doc;
	doc.base_imponible = 0;
	doc.total_taxes = 0;
	doc.total = 0;

	if(doc.items) {
		$.each(doc.items, function(index, data){
			doc.base_imponible += (data.unit_price * data.qty);
			doc.total_taxes += (data.unit_price_with_tax - data.unit_price) * data.qty;
		})
		doc.total += doc.base_imponible + doc.total_taxes;
	}
	refresh_field('base_imponible')
	refresh_field('total_taxes')
	refresh_field('total')
}
