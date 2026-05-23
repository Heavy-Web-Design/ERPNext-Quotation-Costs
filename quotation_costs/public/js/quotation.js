frappe.ui.form.on('Quotation Costs Item', {

    // Event triggered when a new row is added to the child table
    quote_costs_items_add(frm, cdt, cdn) {
        setTimeout(() => {
            setup_item_field(frm, cdt, cdn);
        }, 300);
    },

    // Event triggered when a row is opened in the inline grid editor
    form_render(frm, cdt, cdn) {
        setTimeout(() => {
            setup_item_field(frm, cdt, cdn);
        }, 300);
    },

    item(frm, cdt, cdn) {
        
        var d = locals[cdt][cdn];

        // Find the full item object from Quotation items table
        let quote_item = frm.doc.items.find(item => item.name === d.item);

        if (quote_item) {
            frappe.model.set_value(cdt, cdn, "item_name", quote_item.name);
            frappe.model.set_value(cdt, cdn, "item_title", quote_item.item_name);
        }
    }

});

// Helper function to setup the item select field
function setup_item_field(frm, cdt, cdn) {
    
    let grid_row = frm.fields_dict['quote_costs_items'].grid.get_row(cdn);
    
    if (!grid_row) {
        console.log("Grid row not found");
        return;
    }
    
    let select_field = grid_row.get_field('item');
    
    if (!select_field) {
        console.log("Item select field not found");
        return;
    }

    // Get all items from the parent Quotation's items table
    let options = [];
    if (frm.doc.items && frm.doc.items.length > 0) {
        options = frm.doc.items.map(item => {
            let item_name = item.name || '';  // Value (unique row identifier)
            let item_code = item.item_code || '';
            let item_title = item.item_name || '';
            let label = item_code + ' - ' + item_title;  // Label to display
            return { "label": label, "value": item_name };  // Format: value|label
        });
    }
    
    // Set the options on the field definition as newline-separated string
    frm.set_df_property('quote_costs_items', 'options', options, cdt, 'item', cdn);
    
    // Refresh the field to apply changes
    select_field.refresh();
    
}
