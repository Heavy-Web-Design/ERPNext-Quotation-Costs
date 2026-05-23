frappe.ui.form.on('Quotation', {

    get_items(frm) {

        // Get checked rows
        const checked = frm.doc.items.filter(r => r.__checked == 1);
        if(checked.length == 0) {
            frappe.msgprint(__("Please make a selection on main items table"), "Error")
        } else {
            checked.forEach(r => {
                const child = frm.add_child('quote_costs_items');
                const cdt = child.doctype;
                const cdn = child.name;
                frappe.model.set_value(cdt, cdn, "item", r.name)
                frappe.model.set_value(cdt, cdn, "title", `${r.item_code}: ${r.item_name}`)
                frm.refresh_field("quote_costs_items");
            })
        }
        
    },

});