'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface AnalyticsDialogProps {
  stats: {
    total: number
    indexed: number
    notIndexed: number
    errors: number
    notFetched: number
    progress: number
  }
  campaignName: string
}

const COLORS = {
  indexed: '#10b981',
  notIndexed: '#f59e0b',
  errors: '#ef4444',
  notFetched: '#6b7280',
}

export function AnalyticsDialog({ stats, campaignName }: AnalyticsDialogProps) {
  const [open, setOpen] = useState(false)

  // Pie chart data
  const pieData = [
    { name: 'Indexed', value: stats.indexed, color: COLORS.indexed },
    { name: 'Not Indexed', value: stats.notIndexed, color: COLORS.notIndexed },
    { name: 'Errors', value: stats.errors, color: COLORS.errors },
    { name: 'Not Fetched', value: stats.notFetched, color: COLORS.notFetched },
  ].filter(item => item.value > 0)

  // Bar chart data
  const barData = [
    {
      name: 'Indexed',
      count: stats.indexed,
      percentage: ((stats.indexed / stats.total) * 100).toFixed(1),
      fill: COLORS.indexed,
    },
    {
      name: 'Not Indexed',
      count: stats.notIndexed,
      percentage: ((stats.notIndexed / stats.total) * 100).toFixed(1),
      fill: COLORS.notIndexed,
    },
    {
      name: 'Errors',
      count: stats.errors,
      percentage: ((stats.errors / stats.total) * 100).toFixed(1),
      fill: COLORS.errors,
    },
    {
      name: 'Not Fetched',
      count: stats.notFetched,
      percentage: ((stats.notFetched / stats.total) * 100).toFixed(1),
      fill: COLORS.notFetched,
    },
  ]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            Count: {payload[0].value}
          </p>
          <p className="text-sm text-muted-foreground">
            Percentage: {((payload[0].value / stats.total) * 100).toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Analytics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Campaign Analytics</DialogTitle>
          <DialogDescription>
            Detailed insights and metrics for <span className="font-medium">{campaignName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total URLs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.progress}%</div>
                <div className="mt-2 w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${stats.progress}%` }}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {((stats.indexed / stats.total) * 100).toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {((stats.errors / stats.total) * 100).toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>URLs grouped by their current status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => {
                        const { name, percent } = props
                        return `${name}: ${(percent * 100).toFixed(0)}%`
                      }}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Status Breakdown</CardTitle>
                <CardDescription>Count and percentage for each status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Statistics</CardTitle>
              <CardDescription>Complete breakdown of all URL statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-500/5">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.indexed }} />
                    <div>
                      <p className="font-medium">Indexed</p>
                      <p className="text-sm text-muted-foreground">Successfully indexed on Google</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{stats.indexed}</p>
                    <p className="text-sm text-muted-foreground">
                      {((stats.indexed / stats.total) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-orange-500/5">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.notIndexed }} />
                    <div>
                      <p className="font-medium">Not Indexed</p>
                      <p className="text-sm text-muted-foreground">Not found in Google search results</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{stats.notIndexed}</p>
                    <p className="text-sm text-muted-foreground">
                      {((stats.notIndexed / stats.total) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-red-500/5">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.errors }} />
                    <div>
                      <p className="font-medium">Errors</p>
                      <p className="text-sm text-muted-foreground">Failed to check or encountered errors</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{stats.errors}</p>
                    <p className="text-sm text-muted-foreground">
                      {((stats.errors / stats.total) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.notFetched }} />
                    <div>
                      <p className="font-medium">Not Fetched</p>
                      <p className="text-sm text-muted-foreground">Waiting to be checked</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{stats.notFetched}</p>
                    <p className="text-sm text-muted-foreground">
                      {((stats.notFetched / stats.total) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
