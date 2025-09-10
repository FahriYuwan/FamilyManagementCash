import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { MonthlyReport, CategoryReport, DebtReport, BusinessOrderReport } from './reports-service'

export interface ExportData {
  monthly?: MonthlyReport[]
  categories?: {
    income: CategoryReport[]
    expense: CategoryReport[]
  }
  debts?: DebtReport[]
  business?: BusinessOrderReport[]
}

export class ExportService {
  static exportToPDF(data: ExportData, title: string, userName: string): void {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const marginLeft = 20
    let currentY = 20

    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(title, pageWidth / 2, currentY, { align: 'center' })
    
    currentY += 10
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated for: ${userName}`, pageWidth / 2, currentY, { align: 'center' })
    doc.text(`Date: ${format(new Date(), 'PPP')}`, pageWidth / 2, currentY + 8, { align: 'center' })
    
    currentY += 25

    // Monthly Report
    if (data.monthly && data.monthly.length > 0) {
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Monthly Financial Summary', marginLeft, currentY)
      currentY += 10

      autoTable(doc, {
        startY: currentY,
        head: [['Month', 'Income', 'Expenses', 'Balance', 'Business Revenue', 'Business Profit']],
        body: data.monthly.map(month => [
          month.month,
          `$${month.income.toLocaleString()}`,
          `$${month.expenses.toLocaleString()}`,
          `$${month.balance.toLocaleString()}`,
          `$${(month.business_revenue || 0).toLocaleString()}`,
          `$${(month.business_profit || 0).toLocaleString()}`
        ]),
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' }
        }
      })

      currentY = (doc as any).lastAutoTable.finalY + 20
    }

    // Category Report - Expenses
    if (data.categories?.expense && data.categories.expense.length > 0) {
      if (currentY > 220) {
        doc.addPage()
        currentY = 20
      }

      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Top Expense Categories', marginLeft, currentY)
      currentY += 10

      autoTable(doc, {
        startY: currentY,
        head: [['Category', 'Amount', 'Percentage', 'Transactions']],
        body: data.categories.expense.slice(0, 10).map(cat => [
          cat.category,
          `$${cat.amount.toLocaleString()}`,
          `${cat.percentage.toFixed(1)}%`,
          cat.count.toString()
        ]),
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      })

      currentY = (doc as any).lastAutoTable.finalY + 20
    }

    // Category Report - Income
    if (data.categories?.income && data.categories.income.length > 0) {
      if (currentY > 220) {
        doc.addPage()
        currentY = 20
      }

      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Income Sources', marginLeft, currentY)
      currentY += 10

      autoTable(doc, {
        startY: currentY,
        head: [['Category', 'Amount', 'Percentage', 'Transactions']],
        body: data.categories.income.map(cat => [
          cat.category,
          `$${cat.amount.toLocaleString()}`,
          `${cat.percentage.toFixed(1)}%`,
          cat.count.toString()
        ]),
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [16, 185, 129], textColor: 255 },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      })

      currentY = (doc as any).lastAutoTable.finalY + 20
    }

    // Debt Report
    if (data.debts && data.debts.length > 0) {
      if (currentY > 200) {
        doc.addPage()
        currentY = 20
      }

      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Debt Position Trend', marginLeft, currentY)
      currentY += 10

      autoTable(doc, {
        startY: currentY,
        head: [['Month', 'Receivables', 'Payables', 'Net Position']],
        body: data.debts.map(debt => [
          debt.month,
          `$${debt.receivables.toLocaleString()}`,
          `$${debt.payables.toLocaleString()}`,
          `$${debt.net_position.toLocaleString()}`
        ]),
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [139, 69, 19], textColor: 255 },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      })

      currentY = (doc as any).lastAutoTable.finalY + 20
    }

    // Business Report
    if (data.business && data.business.length > 0) {
      if (currentY > 180) {
        doc.addPage()
        currentY = 20
      }

      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Business Performance', marginLeft, currentY)
      currentY += 10

      autoTable(doc, {
        startY: currentY,
        head: [['Month', 'Orders', 'Revenue', 'Expenses', 'Profit', 'Avg Order Value']],
        body: data.business.map(biz => [
          biz.month,
          biz.orders_count.toString(),
          `$${biz.total_revenue.toLocaleString()}`,
          `$${biz.total_expenses.toLocaleString()}`,
          `$${biz.profit.toLocaleString()}`,
          `$${biz.average_order_value.toLocaleString()}`
        ]),
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [147, 51, 234], textColor: 255 },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' }
        }
      })
    }

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, 285)
      doc.text('Family Management Cash - Financial Report', marginLeft, 285)
    }

    // Save PDF
    const fileName = `financial_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`
    doc.save(fileName)
  }

  static exportToExcel(data: ExportData, fileName: string): void {
    const workbook = XLSX.utils.book_new()

    // Monthly Report Sheet
    if (data.monthly && data.monthly.length > 0) {
      const monthlyData = data.monthly.map(month => ({
        Month: month.month,
        Income: month.income,
        Expenses: month.expenses,
        Balance: month.balance,
        'Business Revenue': month.business_revenue || 0,
        'Business Profit': month.business_profit || 0
      }))

      const monthlySheet = XLSX.utils.json_to_sheet(monthlyData)
      XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Summary')
    }

    // Income Categories Sheet
    if (data.categories?.income && data.categories.income.length > 0) {
      const incomeData = data.categories.income.map(cat => ({
        Category: cat.category,
        Amount: cat.amount,
        'Percentage (%)': parseFloat(cat.percentage.toFixed(2)),
        'Transaction Count': cat.count
      }))

      const incomeSheet = XLSX.utils.json_to_sheet(incomeData)
      XLSX.utils.book_append_sheet(workbook, incomeSheet, 'Income Categories')
    }

    // Expense Categories Sheet
    if (data.categories?.expense && data.categories.expense.length > 0) {
      const expenseData = data.categories.expense.map(cat => ({
        Category: cat.category,
        Amount: cat.amount,
        'Percentage (%)': parseFloat(cat.percentage.toFixed(2)),
        'Transaction Count': cat.count
      }))

      const expenseSheet = XLSX.utils.json_to_sheet(expenseData)
      XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Expense Categories')
    }

    // Debt Trend Sheet
    if (data.debts && data.debts.length > 0) {
      const debtData = data.debts.map(debt => ({
        Month: debt.month,
        Receivables: debt.receivables,
        Payables: debt.payables,
        'Net Position': debt.net_position
      }))

      const debtSheet = XLSX.utils.json_to_sheet(debtData)
      XLSX.utils.book_append_sheet(workbook, debtSheet, 'Debt Trend')
    }

    // Business Performance Sheet
    if (data.business && data.business.length > 0) {
      const businessData = data.business.map(biz => ({
        Month: biz.month,
        'Orders Count': biz.orders_count,
        'Total Revenue': biz.total_revenue,
        'Total Expenses': biz.total_expenses,
        Profit: biz.profit,
        'Average Order Value': biz.average_order_value
      }))

      const businessSheet = XLSX.utils.json_to_sheet(businessData)
      XLSX.utils.book_append_sheet(workbook, businessSheet, 'Business Performance')
    }

    // Save Excel file
    const finalFileName = `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    XLSX.writeFile(workbook, finalFileName)
  }

  static exportToCSV(data: any[], fileName: string): void {
    if (!data || data.length === 0) return

    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  static async exportAllData(data: ExportData, userName: string, format: 'pdf' | 'excel' | 'csv') {
    switch (format) {
      case 'pdf':
        this.exportToPDF(data, 'Financial Report', userName)
        break
      case 'excel':
        this.exportToExcel(data, 'financial_report')
        break
      case 'csv':
        // Export monthly data as CSV
        if (data.monthly) {
          this.exportToCSV(data.monthly, 'monthly_report')
        }
        break
    }
  }
}