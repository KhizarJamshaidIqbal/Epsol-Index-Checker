import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export async function parseFile(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    if (fileExtension === 'csv' || fileExtension === 'txt') {
      // Parse CSV/TXT file
      Papa.parse(file, {
        complete: (results) => {
          const extractedUrls: string[] = []
          results.data.forEach((row: any) => {
            if (Array.isArray(row)) {
              row.forEach((cell) => {
                if (typeof cell === 'string' && cell.trim().startsWith('http')) {
                  extractedUrls.push(cell.trim())
                }
              })
            } else if (typeof row === 'object') {
              Object.values(row).forEach((cell) => {
                if (typeof cell === 'string' && cell.trim().startsWith('http')) {
                  extractedUrls.push(cell.trim())
                }
              })
            }
          })
          resolve(extractedUrls)
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`))
        },
      })
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Parse Excel file
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const extractedUrls: string[] = []

          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName]
            const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
            
            jsonData.forEach((row) => {
              row.forEach((cell) => {
                if (typeof cell === 'string' && cell.trim().startsWith('http')) {
                  extractedUrls.push(cell.trim())
                }
              })
            })
          })

          resolve(extractedUrls)
        } catch (err) {
          reject(new Error('Failed to parse Excel file'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsBinaryString(file)
    } else {
      reject(new Error('Unsupported file format. Please use CSV, TXT, or Excel files.'))
    }
  })
}
