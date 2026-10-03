const RECOMMENDED_HEADERS = ['ลูกค้า', 'เลขที่เอกสาร', 'วันที่เอกสาร', 'หมวดหมู่สินค้า', 'จำนวน', 'มูลค่าก่อนภาษี', 'มูลค่า']
const loadXlsx = () => import('xlsx')

const numberValue = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number(String(value ?? '').replace(/,/g, '').replace(/฿/g, '').trim())
  return Number.isFinite(parsed) ? parsed : 0
}

const excelSerialToDate = (value) => new Date(Date.UTC(1899, 11, 30) + Number(value) * 86400000)

const parseDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === 'number' && value > 20000) return excelSerialToDate(value)
  const text = String(value ?? '').trim()
  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (match) {
    const [, day, month, year] = match
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    return Number.isNaN(date.getTime()) ? null : date
  }
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date
}

const dateKey = (value) => {
  const date = parseDate(value)
  return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : 'ไม่ระบุวันที่'
}

const dateLabel = (value) => {
  const date = parseDate(value)
  return date ? new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }).format(date) : '-'
}

const monthLabel = (key) => {
  if (key === 'ไม่ระบุวันที่') return key
  const [year, month] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('th-TH', { month: 'short', year: 'numeric' }).format(new Date(year, month - 1, 1))
}

const formatCurrency = (value) => `฿ ${Math.round(value).toLocaleString('en-US')}`

const asCleanRow = (row, index) => ({
  ...row,
  ลำดับ: index + 1,
  ID: row.ID ?? '',
  ประเภทคู่ค้า: row['ประเภทคู่ค้า'] ?? '',
  ลูกค้า: row['ลูกค้า'] ?? '',
  เลขที่เอกสาร: row['เลขที่เอกสาร'] ?? '',
  อ้างอิง: row['อ้างอิง'] ?? '',
  วันที่เอกสาร: row['วันที่เอกสาร'] ?? '',
  วันที่ครบกำหนด: row['วันที่ครบกำหนด'] ?? '',
  โครงการ: row['โครงการ'] ?? '',
  หมวดหมู่สินค้า: row['หมวดหมู่สินค้า'] ?? '(ไม่ระบุ)',
  รหัสสินค้า: row['รหัสสินค้า'] ?? '',
  รายละเอียด: row['รายละเอียด'] ?? '',
  จำนวน: numberValue(row['จำนวน']),
  หน่วย: row['หน่วย'] ?? '',
  ราคาต่อหน่วย: numberValue(row['ราคาต่อหน่วย']),
  มูลค่าก่อนภาษี: numberValue(row['มูลค่าก่อนภาษี']),
  มูลค่า: numberValue(row['มูลค่า']),
  เดือน: dateKey(row['วันที่เอกสาร']),
})

export const calculateSalesReport = (rows, fileName = 'ข้อมูลดิบ.xlsx', availableHeaders = Object.keys(rows[0] || {})) => {
  const calculatedRows = rows.map(asCleanRow)
  const monthMap = new Map()
  const customerMap = new Map()
  const categoryMap = new Map()
  const documents = new Set()

  calculatedRows.forEach((row) => {
    const documentKey = row['เลขที่เอกสาร']
    if (documentKey) documents.add(documentKey)
    const month = monthMap.get(row.เดือน) || { month: row.เดือน, monthLabel: monthLabel(row.เดือน), beforeTax: 0, total: 0, rows: 0, documents: new Set() }
    month.beforeTax += row['มูลค่าก่อนภาษี']
    month.total += row['มูลค่า']
    month.rows += 1
    if (row['เลขที่เอกสาร']) month.documents.add(row['เลขที่เอกสาร'])
    monthMap.set(row.เดือน, month)

    const customerKey = row.ลูกค้า || '(ไม่ระบุลูกค้า)'
    const customer = customerMap.get(customerKey) || { customer: customerKey, type: row['ประเภทคู่ค้า'] || '-', documents: new Set(), rows: 0, quantity: 0, beforeTax: 0, total: 0, lastDocumentDate: null }
    if (row['เลขที่เอกสาร']) customer.documents.add(row['เลขที่เอกสาร'])
    customer.rows += 1
    customer.quantity += row.จำนวน
    customer.beforeTax += row['มูลค่าก่อนภาษี']
    customer.total += row.มูลค่า
    const currentDate = parseDate(row['วันที่เอกสาร'])
    if (currentDate && (!customer.lastDocumentDate || currentDate > customer.lastDocumentDate)) customer.lastDocumentDate = currentDate
    customerMap.set(customerKey, customer)

    const categoryKey = row['หมวดหมู่สินค้า'] || '(ไม่ระบุ)'
    const category = categoryMap.get(categoryKey) || { category: categoryKey, rows: 0, quantity: 0, beforeTax: 0, total: 0 }
    category.rows += 1
    category.quantity += row.จำนวน
    category.beforeTax += row['มูลค่าก่อนภาษี']
    category.total += row.มูลค่า
    categoryMap.set(categoryKey, category)
  })

  const months = [...monthMap.values()].sort((a, b) => a.month.localeCompare(b.month)).map((item) => ({ ...item, documents: item.documents.size }))
  const customers = [...customerMap.values()].sort((a, b) => b.total - a.total).map((item) => ({ ...item, documents: item.documents.size, lastDocumentDate: dateLabel(item.lastDocumentDate) }))
  const categories = [...categoryMap.values()].sort((a, b) => b.total - a.total)

  return {
    fileName,
    rowCount: calculatedRows.length,
    documentCount: documents.size,
    customerCount: customers.length,
    totalBeforeTax: calculatedRows.reduce((sum, row) => sum + row['มูลค่าก่อนภาษี'], 0),
    total: calculatedRows.reduce((sum, row) => sum + row.มูลค่า, 0),
    dateRange: months.length && months[0].month !== 'ไม่ระบุวันที่' ? `${months[0].monthLabel} - ${months[months.length - 1].monthLabel}` : 'ไม่ระบุวันที่',
    availableHeaders,
    missingHeaders: RECOMMENDED_HEADERS.filter((header) => !availableHeaders.includes(header)),
    months,
    customers,
    categories,
    rows: calculatedRows,
  }
}

export const importSalesWorkbook = async (file) => {
  const XLSX = await loadXlsx()
  const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: true })
  const firstSheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[firstSheetName]
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true })
  const headers = (matrix[0] || []).map((header) => String(header ?? '').trim())
  if (!headers.length) throw new Error('ไม่พบหัวตารางในชีตแรกของไฟล์')
  const rows = matrix.slice(1).filter((row) => row.some((value) => value !== null && value !== ''))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])))
  return calculateSalesReport(rows, file.name, headers)
}

export const exportSalesWorkbook = async (report) => {
  const XLSX = await loadXlsx()
  const workbook = XLSX.utils.book_new()
  const dashboardRows = [
    ['Executive Dashboard - Sales Calculation'],
    ['ไฟล์ต้นทาง', report.fileName],
    ['ช่วงข้อมูล', report.dateRange],
    ['คอลัมน์ที่พบ', report.availableHeaders.join(', ') || '-'],
    ['คอลัมน์ที่ไม่พบ', report.missingHeaders.join(', ') || '-'],
    [],
    ['ตัวชี้วัด', 'ค่า'],
    ['จำนวนรายการข้อมูล', report.rowCount],
    ['จำนวนเอกสาร', report.documentCount],
    ['จำนวนลูกค้า', report.customerCount],
    ['ยอดก่อนภาษี', report.totalBeforeTax],
    ['ยอดรวม', report.total],
    [],
    ['สรุปยอดขายรายเดือน'],
    ['เดือน', 'ยอดก่อนภาษี', 'ยอดรวม', 'จำนวนรายการ', 'จำนวนเอกสาร'],
    ...report.months.map((item) => [item.monthLabel, item.beforeTax, item.total, item.rows, item.documents]),
    [],
    ['Top 20 ลูกค้าตามยอดรวม'],
    ['ลูกค้า', 'ประเภทคู่ค้า', 'จำนวนเอกสาร', 'จำนวนรายการ', 'จำนวนสินค้า', 'ยอดก่อนภาษี', 'ยอดรวม', 'เอกสารล่าสุด'],
    ...report.customers.slice(0, 20).map((item) => [item.customer, item.type, item.documents, item.rows, item.quantity, item.beforeTax, item.total, item.lastDocumentDate]),
    [],
    ['สรุปตามหมวดหมู่สินค้า'],
    ['หมวดหมู่สินค้า', 'จำนวนรายการ', 'จำนวนสินค้า', 'ยอดก่อนภาษี', 'ยอดรวม'],
    ...report.categories.map((item) => [item.category, item.rows, item.quantity, item.beforeTax, item.total]),
    [],
    ['หมายเหตุ', 'ยอดและสรุปคำนวณจากข้อมูลในไฟล์ต้นทางเท่านั้น ส่วน Budget/Forecast ต้องมีตารางเป้าขายเพิ่มเติมจึงจะคำนวณได้'],
  ]
  const dashboard = XLSX.utils.aoa_to_sheet(dashboardRows)
  dashboard['!cols'] = [{ wch: 34 }, { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(workbook, dashboard, 'Executive Dashboard')

  const customerSheet = XLSX.utils.json_to_sheet(report.customers.map((item) => ({ ...item, 'ยอดก่อนภาษี': item.beforeTax, 'ยอดรวม': item.total })))
  customerSheet['!cols'] = [{ wch: 48 }, { wch: 26 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(workbook, customerSheet, 'Customer Summary')

  const categorySheet = XLSX.utils.json_to_sheet(report.categories.map((item) => ({ ...item, 'ยอดก่อนภาษี': item.beforeTax, 'ยอดรวม': item.total })))
  categorySheet['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(workbook, categorySheet, 'Category Summary')

  const dataSheet = XLSX.utils.json_to_sheet(report.rows)
  dataSheet['!cols'] = [{ wch: 10 }, { wch: 25 }, { wch: 46 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 34 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Calculated Data')

  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([output], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'ข้อมูลหลังจากนำมาคำนวณแล้ว.xlsx'
  anchor.click()
  URL.revokeObjectURL(url)
}

export { formatCurrency, monthLabel }
