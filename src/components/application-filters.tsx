'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Filter, X, Search } from 'lucide-react'
import type { ApplicationFilters } from '@/lib/types'

interface ApplicationFiltersProps {
  filters: ApplicationFilters
  onFiltersChange: (filters: ApplicationFilters) => void
  onSearch: () => void
  onClear: () => void
}

export function ApplicationFiltersPanel({ filters, onFiltersChange, onSearch, onClear }: ApplicationFiltersProps) {
  const updateFilter = (key: keyof ApplicationFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Search & Filter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Username, Discord ID, Steam ID..."
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {filters.status === 'all' || !filters.status ? 'All Status' : filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => updateFilter('status', 'all')}>All Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateFilter('status', 'pending')}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateFilter('status', 'approved')}>Approved</DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateFilter('status', 'denied')}>Denied</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {filters.priority === 'all' || !filters.priority ? 'All Priorities' : filters.priority.charAt(0).toUpperCase() + filters.priority.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => updateFilter('priority', 'all')}>All Priorities</DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateFilter('priority', 'low')}>Low</DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateFilter('priority', 'normal')}>Normal</DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateFilter('priority', 'high')}>High</DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateFilter('priority', 'urgent')}>Urgent</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <Label>Date From</Label>
            <Input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
            />
          </div>

          <div className="space-y-2">
            <Label>Date To</Label>
            <Input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={onSearch} className="flex-1">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button onClick={onClear} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
