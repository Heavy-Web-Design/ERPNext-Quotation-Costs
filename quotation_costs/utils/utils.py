# Copyright (c) 2026, Heavy Web Design
# License:

import frappe
from erpnext.controllers.taxes_and_totals import calculate_taxes_and_totals



@frappe.whitelist()
def calculate_single_value_tax(amount, template_name):
    """
    Calculate the tax rate for a given value.
    """
    # 1. Because calculate_taxes_and_totals built-in function expects a doc, create an in-memory mock Purchase Invoice
    doc = frappe.new_doc("Purchase Invoice")

    # 2. Add your single value as a mock item
    doc.append( "items", { "qty": 1, "rate": float(amount) } )

    # 3. Append rows from your chosen Tax Template
    template = frappe.get_doc("Purchase Taxes and Charges Template", template_name)
    for tax_row in template.taxes:
        doc.append("taxes", tax_row.as_dict())

    # 4. Run the calculation engine
    calculate_taxes_and_totals(doc)
    
    # 5. Extract results
    return {
        "tax_amount": doc.grand_total - doc.net_total,
        "grand_total": doc.grand_total,
        "tax_breakdown": [{"account": t.account_head, "amount": t.tax_amount} for t in doc.taxes]
    }