frappe.ui.form.on('Quotation', {

    refresh(frm) {

        frappe.db.get_value('Purchase Taxes and Charges Template', 
            {'company': frm.doc.company, 'is_default': 1}, 'name', (r) => {

                if (r && r.name) {
                    
                    globalThis.default_purchase_taxes_and_charges_template = "El Salvador Tax - ED";
                    
                    frm.doc.quote_costs_items.forEach(function(row) {
                        set__purchase_taxes_and_charges_template(frm, row.doctype, row.name);
                    });
                    
                    // Refresh the child table field in the UI
                    frm.refresh_field('quote_costs_items');
                }

            }
        );


    },

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


frappe.ui.form.on('Quotation Costs Item', {

    quote_costs_items_add(frm, cdt, cdn) {
        set__purchase_taxes_and_charges_template(frm, cdt, cdn);
    },

    form_render(frm, cdt, cdn) {
        set__purchase_taxes_and_charges_template(frm, cdt, cdn);
    },

    qty(frm, cdt, cdn) {
        calculate__amount(frm, cdt, cdn);
    }, 
    rate(frm, cdt, cdn) {
        calculate__amount(frm, cdt, cdn);
    }
    
});


const calculate__amount = (frm, cdt, cdn) => {

    const d = locals[cdt][cdn];

    // Set amount based on rate, qty and taxes
    frappe.call('quotation_costs.utils.utils.calculate_single_value_tax', {
        amount: d.rate * d.qty,
        template_name: d.purchase_taxes_and_charges_template
    }).then((r) => {
        if (r.message) {
            frappe.model.set_value(cdt, cdn, 'amount', r.message.grand_total);
        }
    });
}


/**
 * Sets the purchase taxes and charges template for a given row in the quote_costs_items table if it's not already set.
 * @param {*} frm 
 * @param {*} cdt 
 * @param {*} cdn 
 */
const set__purchase_taxes_and_charges_template = (frm, cdt, cdn) => {
    
    var d = locals[cdt][cdn];
    
    // Check if the field is empty to prevent overwriting existing data
    if (!d.purchase_taxes_and_charges_template) {
        frappe.model.set_value(cdt, cdn, 'purchase_taxes_and_charges_template', default_purchase_taxes_and_charges_template);
    }

}