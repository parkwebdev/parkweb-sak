import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw01 as Loading, Plus as Sparkles, Users01 as User } from '@untitledui/icons';

interface GenerateSOWDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (sowData: any) => void;
}

interface OnboardingSubmission {
  id: string;
  client_name: string;
  client_email: string;
  project_type: string;
  description: string;
  timeline: string;
  budget_range: string;
  industry: string;
}

export const GenerateSOWDialog: React.FC<GenerateSOWDialogProps> = ({
  open,
  onOpenChange,
  onGenerated
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<OnboardingSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [useExistingSubmission, setUseExistingSubmission] = useState(true);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>('');
  
  // Manual input form state
  const [manualData, setManualData] = useState({
    client_name: '',
    client_email: '',
    project_type: '',
    description: '',
    timeline: '',
    budget_range: '',
    industry: '',
  });
  
  const [customPrompt, setCustomPrompt] = useState('');

  // Fetch onboarding submissions when dialog opens
  useEffect(() => {
    if (open) {
      fetchSubmissions();
    }
  }, [open]);

  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const { data, error } = await supabase
        .from('onboarding_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching submissions:', error);
        toast({
          title: "Error",
          description: "Failed to load submissions. You can still create manually.",
          variant: "destructive",
        });
        setSubmissions([]);
      } else {
        setSubmissions(data || []);
        // Auto-select first submission if available
        if (data && data.length > 0) {
          setSelectedSubmissionId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      let requestData: any = {};

      if (useExistingSubmission && selectedSubmissionId) {
        requestData.submissionId = selectedSubmissionId;
      } else {
        // Validate manual input
        const { client_name, client_email, project_type, description, timeline, budget_range, industry } = manualData;
        if (!client_name || !client_email || !project_type || !description || !timeline || !budget_range || !industry) {
          toast({
            title: "Missing Information",
            description: "Please fill in all required fields.",
            variant: "destructive",
          });
          return;
        }
        requestData.clientData = manualData;
      }

      if (customPrompt.trim()) {
        requestData.customPrompt = customPrompt;
      }

      console.log('Generating SOW with data:', requestData);

      const response = await supabase.functions.invoke('generate-scope-of-work', {
        body: requestData
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate scope of work');
      }

      const data = response.data;
      
      if (!data || data.error) {
        throw new Error(data?.error || 'Invalid response from AI service');
      }

      toast({
        title: "Scope of Work Generated!",
        description: "Your AI-generated scope of work is ready for review.",
      });

      onGenerated(data);
      onOpenChange(false);
      
      // Reset form
      setCustomPrompt('');
      setManualData({
        client_name: '',
        client_email: '',
        project_type: '',
        description: '',
        timeline: '',
        budget_range: '',
        industry: '',
      });
      
    } catch (error: any) {
      console.error('Error generating SOW:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate scope of work. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateManualData = (field: keyof typeof manualData, value: string) => {
    setManualData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generate Scope of Work with AI
          </DialogTitle>
          <DialogDescription>
            Create a comprehensive, professional scope of work using AI based on client requirements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Source Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Data Source</Label>
            <div className="flex gap-4">
              <Button
                variant={useExistingSubmission ? "default" : "outline"}
                size="sm"
                onClick={() => setUseExistingSubmission(true)}
                className="flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Existing Submission
              </Button>
              <Button
                variant={!useExistingSubmission ? "default" : "outline"}
                size="sm"
                onClick={() => setUseExistingSubmission(false)}
                className="flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Manual Input
              </Button>
            </div>
          </div>

          {/* Existing Submission Selection */}
          {useExistingSubmission && (
            <div className="space-y-3">
              <Label>Select Client Submission</Label>
              {loadingSubmissions ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loading className="w-4 h-4 animate-spin" />
                  Loading submissions...
                </div>
              ) : submissions.length > 0 ? (
                <Select value={selectedSubmissionId} onValueChange={setSelectedSubmissionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client submission" />
                  </SelectTrigger>
                  <SelectContent>
                    {submissions.map((submission) => (
                      <SelectItem key={submission.id} value={submission.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{submission.client_name}</span>
                          <span className="text-sm text-muted-foreground">
                            {submission.project_type} • {submission.industry}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                  No submissions found. Switch to manual input to create a scope of work.
                </div>
              )}
            </div>
          )}

          {/* Manual Input Form */}
          {!useExistingSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client Name *</Label>
                  <Input
                    value={manualData.client_name}
                    onChange={(e) => updateManualData('client_name', e.target.value)}
                    placeholder="Enter client name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client Email *</Label>
                  <Input
                    type="email"
                    value={manualData.client_email}
                    onChange={(e) => updateManualData('client_email', e.target.value)}
                    placeholder="Enter client email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project Type *</Label>
                  <Input
                    value={manualData.project_type}
                    onChange={(e) => updateManualData('project_type', e.target.value)}
                    placeholder="e.g., Website Development"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Industry *</Label>
                  <Input
                    value={manualData.industry}
                    onChange={(e) => updateManualData('industry', e.target.value)}
                    placeholder="e.g., Healthcare"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Project Description *</Label>
                <Textarea
                  value={manualData.description}
                  onChange={(e) => updateManualData('description', e.target.value)}
                  placeholder="Describe the project requirements and objectives"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Timeline *</Label>
                  <Input
                    value={manualData.timeline}
                    onChange={(e) => updateManualData('timeline', e.target.value)}
                    placeholder="e.g., 3 months"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Budget Range *</Label>
                  <Input
                    value={manualData.budget_range}
                    onChange={(e) => updateManualData('budget_range', e.target.value)}
                    placeholder="e.g., $10,000 - $20,000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Custom Prompt */}
          <div className="space-y-3">
            <Label>Additional Requirements (Optional)</Label>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Add any specific requirements, constraints, or additional context for the scope of work..."
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loading || (useExistingSubmission && !selectedSubmissionId)}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loading className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {loading ? 'Generating...' : 'Generate Scope of Work'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
