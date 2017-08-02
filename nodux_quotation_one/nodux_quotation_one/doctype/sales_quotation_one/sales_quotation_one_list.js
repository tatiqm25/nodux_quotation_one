// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt

frappe.listview_settings['Sales Quotation One'] = {
	add_fields: ["customer", "customer_name", "base_imponible", "total_taxes", "total", "company", "status"],
	get_indicator: function(doc) {
		if(doc.status=="Draft") {
			return [__("Borrador"), "darkgrey", "status,=,Draft"];
		} else if(doc.status=="Confirmed") {
			return [__("Confirmada"), "orange", "status,=,Confirmed"]
		} else if(doc.status=="Done") {
			return [__("Realizada"), "green", "status,=,Done"]
		}else if (doc.status=="Anulled") {
			return [__("Anuladda"), "red", "status,=,Anulled"]
		}
	},
	right_column: "total"
};
