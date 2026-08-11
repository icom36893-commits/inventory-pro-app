import sqlite3
conn = sqlite3.connect('inventory.db')
cursor = conn.cursor()
cursor.execute("SELECT * FROM journal_vouchers WHERE voucher_number='JV-00002'")
row = cursor.fetchone()
if row:
    print('Voucher:', row)
    cursor.execute('SELECT * FROM journal_voucher_entries WHERE voucher_id=' + str(row[0]))
    entries = cursor.fetchall()
    print('Entries:')
    for e in entries:
        print(e)
else:
    print('Not found')
