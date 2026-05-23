# -*- coding: utf-8 -*-
# Copyright (c) 2024, Heavy Web Design
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields



def add_custom_fields():

    # Add custom fields
    custom_fields = {
        "Quotation": [
            dict(fieldname='section_quote_costs_items', label='Quotation Costs', fieldtype='Section Break', insert_after='net_total', hide_border=True),
            dict(fieldname='quote_costs_items', label='', fieldtype='Table', options='Quotation Costs Item', insert_after='section_quote_costs_items'),
            dict(fieldname='section_quote_costs_totals', label='', fieldtype='Section Break', insert_after='quote_costs_items'),
            dict(fieldname='column_break_qc1', label='', fieldtype='Column Break', insert_after='section_quote_costs_totals'),
            dict(fieldname='get_items', label='Get Items', fieldtype='Button', insert_after='column_break_qc1'),
            dict(fieldname='column_break_qc2', label='', fieldtype='Column Break', insert_after='column_break_qc1'),
            dict(fieldname='column_break_qc3', label='', fieldtype='Column Break', insert_after='column_break_qc2'),
            dict(fieldname='total_average_profit_percent', label='Total Average Profit (%)', fieldtype='Float', insert_after='column_break_qc3'),
            dict(fieldname='column_break_qc4', label='', fieldtype='Column Break', insert_after='total_average_profit_percent'),
            dict(fieldname='total_profit_amount', label='Total Profit', fieldtype='Currency', insert_after='column_break_qc4'),
        ]
    }

    create_custom_fields(custom_fields)
