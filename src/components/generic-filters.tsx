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

interface GenericFiltersProps {
  searchValue: string
  onSearchChange: (value: string) => void
  onSearch: () => void
  onClear: () => void
  statusFilter?: {
    value: string
    options: Array<{ value: string; label: string }>
    onChange: (value: string) => void
  }
  dateFrom?: string
  onDateFromChange?: (value: string) => void
  dateTo?: string
  onDateToChange?: (value: string) => void
}

export function GenericFilters({
  searchValue,
  onSearchChange,
  onSearch,
  onClear,
  statusFilter,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: GenericFiltersProps) {
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
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSearch()
                  }
                }}
              />
            </div>
          </div>

          {statusFilter && (
            <div className="space-y-2">
              <Label>Status</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {statusFilter.options.find(o => o.value === statusFilter.value)?.label || 'All Status'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {statusFilter.options.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => statusFilter.onChange(option.value)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {onDateFromChange && (
            <div className="space-y-2">
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFrom || ''}
                onChange={(e) => onDateFromChange(e.target.value || '')}
              />
            </div>
          )}

          {onDateToChange && (
            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo || ''}
                onChange={(e) => onDateToChange(e.target.value || '')}
              />
            </div>
          )}
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
