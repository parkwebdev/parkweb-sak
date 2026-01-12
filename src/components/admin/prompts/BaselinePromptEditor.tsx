// Prompts Components Stubs
export function BaselinePromptEditor({ value, onChange, loading }: { value: string; onChange: (v: string) => void; loading?: boolean }) {
  return <div className="rounded-lg border border-border bg-card p-4"><textarea value={value} onChange={(e) => onChange(e.target.value)} className="w-full min-h-[200px] bg-transparent" disabled={loading} /></div>;
}
export function PromptPreview({ prompt }: { prompt: string }) {
  return <div className="rounded-lg border border-border bg-muted p-4 text-sm whitespace-pre-wrap">{prompt || 'No prompt configured'}</div>;
}
export function PromptVersionHistory() {
  return <div className="text-sm text-muted-foreground">Version history coming soon</div>;
}
export function SecurityGuardrailsCard({ config, onChange }: { config?: Record<string, boolean>; onChange: (c: Record<string, boolean>) => void }) {
  return <div className="rounded-lg border border-border bg-card p-4"><p className="text-sm font-medium">Security Guardrails</p><p className="text-xs text-muted-foreground mt-1">Configuration coming soon</p></div>;
}
