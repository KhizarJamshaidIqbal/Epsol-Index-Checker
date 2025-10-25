'use client'

import { useState } from 'react'
import { Database, Loader2, Table as TableIcon, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useToast } from '@/components/ui/use-toast'

interface TableInfo {
  name: string
  count: number
}

interface DatabaseInfo {
  databaseName: string
  tables: TableInfo[]
  totalTables: number
  totalRows: number
}

interface TableData {
  tableName: string
  columns: string[]
  rows: any[]
  count: number
}

// Helper function to format cell values
function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL'
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
    try {
      const date = new Date(value)
      return date.toLocaleString()
    } catch {
      return String(value)
    }
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  const str = String(value)
  return str.length > 100 ? str.substring(0, 100) + '...' : str
}

export function DatabaseViewer() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<TableData | null>(null)
  const [loadingTableData, setLoadingTableData] = useState(false)

  async function fetchDatabaseInfo() {
    setLoading(true)
    try {
      const res = await fetch('/api/database')
      const data = await res.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch database info')
      }

      setDbInfo(data.data)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load database info',
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchTableData(tableName: string) {
    setLoadingTableData(true)
    try {
      const res = await fetch(`/api/database/${tableName}`)
      const data = await res.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch table data')
      }

      setTableData(data.data)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load table data',
      })
    } finally {
      setLoadingTableData(false)
    }
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (isOpen && !dbInfo) {
      fetchDatabaseInfo()
    }
    if (!isOpen) {
      setSelectedTable(null)
      setTableData(null)
    }
  }

  async function handleTableClick(tableName: string) {
    if (selectedTable === tableName) {
      setSelectedTable(null)
      setTableData(null)
    } else {
      setSelectedTable(tableName)
      await fetchTableData(tableName)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Database className="h-4 w-4 mr-2" />
          Database
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Database Viewer</SheetTitle>
          <SheetDescription>View database tables and all records</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : dbInfo ? (
          <div className="mt-6 space-y-6">
            {/* Database Info */}
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Database</h3>
              </div>
              <p className="text-sm text-muted-foreground break-all">{dbInfo.databaseName}</p>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Tables</p>
                  <p className="font-bold text-lg">{dbInfo.totalTables}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Rows</p>
                  <p className="font-bold text-lg">{dbInfo.totalRows}</p>
                </div>
              </div>
            </div>

            {/* Tables List */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <TableIcon className="h-4 w-4" />
                Tables
              </h3>
              <div className="space-y-2">
                {dbInfo.tables.map((table) => (
                  <div key={table.name}>
                    <button
                      onClick={() => handleTableClick(table.name)}
                      className={`w-full text-left rounded-lg border p-3 transition-all hover:border-primary hover:bg-accent ${
                        selectedTable === table.name ? 'border-primary bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TableIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{table.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-semibold ${
                              selectedTable === table.name ? 'text-primary' : 'text-muted-foreground'
                            }`}
                          >
                            {table.count} rows
                          </span>
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${
                              selectedTable === table.name ? 'rotate-90' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </button>

                    {/* Table Data Display */}
                    {selectedTable === table.name && (
                      <div className="mt-2 rounded-lg border bg-muted/50 p-3">
                        {loadingTableData ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : tableData ? (
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground mb-2">
                              Showing {tableData.count} rows (max 100)
                            </div>
                            <div className="relative rounded border bg-background">
                              <div className="max-h-96 overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                  <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                      {tableData.columns.map((col) => (
                                        <th
                                          key={col}
                                          className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground whitespace-nowrap sticky top-0 bg-background z-10"
                                        >
                                          {col}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="[&_tr:last-child]:border-0">
                                    {tableData.rows.map((row, idx) => (
                                      <tr
                                        key={idx}
                                        className="border-b transition-colors hover:bg-muted/50"
                                      >
                                        {tableData.columns.map((col) => (
                                          <td
                                            key={col}
                                            className="p-4 align-middle text-xs whitespace-nowrap"
                                          >
                                            {formatCellValue(row[col])}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No data available
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Refresh Button */}
            <Button onClick={fetchDatabaseInfo} variant="outline" className="w-full">
              Refresh Data
            </Button>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No database information available</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
