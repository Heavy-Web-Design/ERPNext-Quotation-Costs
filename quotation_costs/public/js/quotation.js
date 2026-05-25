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
                console.log(cdt, cdn);
                frappe.model.set_value(cdt, cdn, "item", r.name)
                frappe.model.set_value(cdt, cdn, "title", `${r.item_code}: ${r.item_name}`)
                frm.refresh_field("quote_costs_items");
            })
        }
        
    },

    update_items(frm) {

        // Get checked rows
        const checked = frm.doc.quote_costs_items.filter(r => r.__checked == 1);
        if(checked.length == 0) {
            frappe.msgprint(__("Please make a selection on Costs table"), "Error")
        } else {
            
            // Build an array of items and their corresponding customer rates, summing up the rates for duplicate items
            var items_and_rates = [];
            checked.forEach((r, k) => {

                // Check if item already exists in the array
                let existing_item = items_and_rates.find(i => i.item === r.item);

                if (existing_item) {
                    // If exists, add the amount
                    existing_item.amount += r.customer_rate || 0;
                } else {
                    // If not exists, add new item to array
                    items_and_rates.push({ item: r.item, amount: r.customer_rate || 0 });
                }

            })

            // Update the main items table with the new rates
            items_and_rates.forEach(j => {
                frappe.model.set_value("Quotation Item", j.item, 'rate', j.amount);
            });

            frm.refresh_field("items");

            
        }

    }

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
        calculate__profit_amount__customer_rate(frm, cdt, cdn);
        calculateTotals__quote_costs_items(frm, cdt, cdn);
    }, 
    rate(frm, cdt, cdn) {
        calculate__amount(frm, cdt, cdn);
        calculate__profit_amount__customer_rate(frm, cdt, cdn);
        calculateTotals__quote_costs_items(frm, cdt, cdn);
    },
    profit_percent(frm, cdt, cdn) {
        calculate__profit_amount__customer_rate(frm, cdt, cdn);
        calculateTotals__quote_costs_items(frm, cdt, cdn);
    },
    fixed_profit(frm, cdt, cdn) {
        const d = locals[cdt][cdn];
        if(d.fixed_profit) {
            frm.set_df_property('quote_costs_items', 'read_only', 1, cdt, 'profit_percent', cdn);
            frm.set_df_property('quote_costs_items', 'read_only', 0, cdt, 'profit_amount', cdn);
        } else {
            frm.set_df_property('quote_costs_items', 'read_only', 0, cdt, 'profit_percent', cdn);
            frm.set_df_property('quote_costs_items', 'read_only', 1, cdt, 'profit_amount', cdn);
        }
    },
    profit_amount(frm, cdt, cdn) {
        calculate__profit_percent__customer_rate(frm, cdt, cdn);
        calculateTotals__quote_costs_items(frm, cdt, cdn);
    }

    
});


const calculate__profit_percent__customer_rate = (frm, cdt, cdn) => {
    const d = locals[cdt][cdn];
    if(d.fixed_profit) {
        // Calculate profit_percent from profit_amount
        const cost_amount = d.rate * d.qty;
        const profit_percent = cost_amount > 0 ? (d.profit_amount / cost_amount) * 100 : 0;
        frappe.model.set_value(cdt, cdn, 'profit_percent', profit_percent);
        frappe.model.set_value(cdt, cdn, 'customer_rate', d.rate * (1 + profit_percent / 100));
    }
}

const calculate__profit_amount__customer_rate = (frm, cdt, cdn) => {
    const d = locals[cdt][cdn];
    if(!d.fixed_profit) {
        const profit_amount = d.rate * d.qty * (d.profit_percent / 100);
        frappe.model.set_value(cdt, cdn, 'profit_amount', profit_amount);
        frappe.model.set_value(cdt, cdn, 'customer_rate', d.rate + profit_amount);
    }
}

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


const calculateTotals__quote_costs_items = (frm, cdt, cdn) => {
    
    var total_profit_amount = 0;
    var total_profit_percent = 0;

    frm.doc.quote_costs_items.forEach(d => {
        total_profit_amount += d.profit_amount;
        total_profit_percent += d.profit_percent;
    });

    var total_average_profit_percent = total_profit_percent / frm.doc.quote_costs_items.length;
    frm.set_value({
        'total_profit_amount': total_profit_amount,
        'total_average_profit_percent': total_average_profit_percent,
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