/**
 * PermissionsMatrix Component
 * 
 * Shared permissions matrix for selecting/viewing admin permissions.
 * Used by both the invite dialog and member sheet.
 * 
 * @module components/admin/team/PermissionsMatrix
 */

import { useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AdminPermission } from '@/types/admin';
import { 
  ADMIN_PERMISSION_GROUPS, 
  ADMIN_PERMISSION_LABELS,
  ADMIN_FEATURE_LABELS,
} from '@/types/admin';

interface PermissionsMatrixProps {
  permissions: AdminPermission[];
  onChange: (permissions: AdminPermission[]) => void;
  disabled?: boolean;
  showHeader?: boolean;
}

/**
 * Reusable permission matrix for selecting Pilot team member permissions.
 * Provides a table with View/Manage columns for each feature group.
 */
export function PermissionsMatrix({
  permissions,
  onChange,
  disabled = false,
  showHeader = false,
}: PermissionsMatrixProps) {
  // Build matrix data: rows are features, columns are View/Manage
  const matrixData = useMemo(() => {
    return Object.entries(ADMIN_PERMISSION_GROUPS).map(([group, groupPermissions]) => {
      const viewPerm = groupPermissions.find(p => p.startsWith('view_'));
      const managePerm = groupPermissions.find(p => p.startsWith('manage_'));
      // Handle permissions that don't follow view_/manage_ pattern (e.g., impersonate_users)
      const actionPerm = groupPermissions.find(p => !p.startsWith('view_') && !p.startsWith('manage_'));
      
      return {
        feature: group,
        label: ADMIN_FEATURE_LABELS[group] || group,
        viewPermission: viewPerm,
        // Action permissions go in the manage column since they're elevated actions
        managePermission: managePerm || actionPerm,
      };
    });
  }, []);

  // Calculate column states for select-all
  const allViewPermissions = matrixData.map(r => r.viewPermission).filter(Boolean) as AdminPermission[];
  const allManagePermissions = matrixData.map(r => r.managePermission).filter(Boolean) as AdminPermission[];
  
  const allViewSelected = allViewPermissions.every(p => permissions.includes(p));
  const someViewSelected = allViewPermissions.some(p => permissions.includes(p)) && !allViewSelected;
  
  const allManageSelected = allManagePermissions.every(p => permissions.includes(p));
  const someManageSelected = allManagePermissions.some(p => permissions.includes(p)) && !allManageSelected;

  const handlePermissionChange = (permission: AdminPermission, checked: boolean) => {
    if (checked) {
      onChange([...permissions, permission]);
    } else {
      onChange(permissions.filter(p => p !== permission));
    }
  };

  const toggleColumnPermissions = (columnPermissions: AdminPermission[], allSelected: boolean) => {
    if (allSelected) {
      onChange(permissions.filter(p => !columnPermissions.includes(p)));
    } else {
      const newPerms = new Set(permissions);
      columnPermissions.forEach(p => newPerms.add(p));
      onChange(Array.from(newPerms));
    }
  };

  return (
    <div className="space-y-3">
      {showHeader && (
        <>
          <Label className="text-sm font-medium">Permissions</Label>
          <p className="text-xs text-muted-foreground">
            Select the features this team member can access.
          </p>
        </>
      )}
      
      <div className="border border-border rounded-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[45%] font-medium text-xs">Feature</TableHead>
              <TableHead className="w-[27.5%] text-center font-medium text-xs">
                <div className="flex items-center justify-center gap-2">
                  <Checkbox
                    checked={allViewSelected}
                    disabled={disabled}
                    ref={(el) => {
                      if (el) {
                        (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someViewSelected;
                      }
                    }}
                    onCheckedChange={() => toggleColumnPermissions(allViewPermissions, allViewSelected)}
                    className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
                  />
                  <span>View</span>
                </div>
              </TableHead>
              <TableHead className="w-[27.5%] text-center font-medium text-xs">
                <div className="flex items-center justify-center gap-2">
                  <Checkbox
                    checked={allManageSelected}
                    disabled={disabled}
                    ref={(el) => {
                      if (el) {
                        (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someManageSelected;
                      }
                    }}
                    onCheckedChange={() => toggleColumnPermissions(allManagePermissions, allManageSelected)}
                    className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
                  />
                  <span>Manage</span>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matrixData.map((row) => (
              <TableRow 
                key={row.feature} 
                className="transition-colors hover:bg-muted/30"
              >
                <TableCell className="text-sm font-medium text-foreground py-2">
                  {row.label}
                </TableCell>
                <TableCell className="text-center py-2">
                  {row.viewPermission && (
                    <div className="flex justify-center" title={ADMIN_PERMISSION_LABELS[row.viewPermission]}>
                      <Checkbox
                        checked={permissions.includes(row.viewPermission)}
                        disabled={disabled}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(row.viewPermission!, checked as boolean)
                        }
                      />
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center py-2">
                  {row.managePermission && (
                    <div className="flex justify-center" title={ADMIN_PERMISSION_LABELS[row.managePermission]}>
                      <Checkbox
                        checked={permissions.includes(row.managePermission)}
                        disabled={disabled}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(row.managePermission!, checked as boolean)
                        }
                      />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
