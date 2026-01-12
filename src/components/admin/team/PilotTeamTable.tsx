// Team Components Stubs
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { PilotTeamMember } from '@/types/admin';
export function PilotTeamTable({ team, onRemove }: { team: PilotTeamMember[]; onRemove?: (id: string) => void }) {
  if (!team.length) return <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">No team members found</div>;
  return (
    <div className="space-y-2">{team.map((m) => <TeamMemberCard key={m.id} member={m} onRemove={onRemove} />)}</div>
  );
}
export function InviteTeamMemberDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) { return null; }
export function TeamMemberActions({ memberId }: { memberId: string }) { return null; }
export function TeamMemberCard({ member, onRemove }: { member: PilotTeamMember; onRemove?: (id: string) => void }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10"><AvatarImage src={member.avatar_url || undefined} /><AvatarFallback>{member.display_name?.[0] || member.email[0]}</AvatarFallback></Avatar>
        <div><p className="text-sm font-medium">{member.display_name || member.email}</p><p className="text-xs text-muted-foreground">{member.email}</p></div>
      </div>
      <Badge variant="secondary">{member.role}</Badge>
    </div>
  );
}
