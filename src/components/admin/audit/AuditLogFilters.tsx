/**
 * AuditLogFilters Component
 * 
 * Filter controls for audit log queries.
 * 
 * @module components/admin/audit/AuditLogFilters
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAuditActionLabel, getTargetTypeLabel } from '@/lib/admin/audit-actions';
import type { AuditAction, AuditTargetType } from '@/types/admin';

interface FilterProps {
  action?: AuditAction;
  targetType?: AuditTargetType;
  search?: string;
}

interface AuditLogFiltersProps {
  /** Callback when filters are applied */
  onApply: (filters: FilterProps) => void;
}

const actionOptions: AuditAction[] = [
  'impersonation_start',
  'impersonation_end',
  'account_suspend',
  'account_activate',
  'account_delete',
  'config_update',
  'plan_create',
  'plan_update',
  'plan_delete',
  'team_invite',
  'team_remove',
  'article_create',
  'article_update',
  'article_delete',
  'email_send',
  'announcement_send',
];

const targetTypes: AuditTargetType[] = [
  'account', 
  'config', 
  'plan', 
  'team', 
  'article', 
  'category', 
  'email'
];

/**
 * Audit log filters component.
 */
export function AuditLogFilters({ onApply }: AuditLogFiltersProps) {
  const [action, setAction] = useState<AuditAction | ''>('');
  const [targetType, setTargetType] = useState<AuditTargetType | ''>('');
  const [search, setSearch] = useState('');

  const handleApply = () => {
    onApply({
      action: action || undefined,
      targetType: targetType || undefined,
      search,
    });
  };

  const handleClear = () => {
    setAction('');
    setTargetType('');
    setSearch('');
    onApply({ search: '' });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Action</Label>
        <Select value={action} onValueChange={(v) => setAction(v as AuditAction | '')}>
          <SelectTrigger>
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All actions</SelectItem>
            {actionOptions.map((a) => (
              <SelectItem key={a} value={a}>
                {getAuditActionLabel(a)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Target Type</Label>
        <Select value={targetType} onValueChange={(v) => setTargetType(v as AuditTargetType | '')}>
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            {targetTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {getTargetTypeLabel(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Search</Label>
        <Input
          placeholder="Search by email or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={handleClear} className="flex-1">
          Clear
        </Button>
        <Button size="sm" onClick={handleApply} className="flex-1">
          Apply
        </Button>
      </div>
    </div>
  );
}
