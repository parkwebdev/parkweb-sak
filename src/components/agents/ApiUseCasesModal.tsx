import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CopyButton } from '@/components/ui/copy-button';
import { 
  Monitor01, 
  Phone01, 
  MessageChatCircle, 
  PhoneCall01, 
  RefreshCcw01, 
  Tool02 
} from '@untitledui/icons';

interface ApiUseCasesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  apiEndpoint: string;
}

const useCases = [
  {
    icon: Monitor01,
    title: 'Custom Chat UI',
    description: 'Build your own frontend chat interface with full control over design and UX.',
  },
  {
    icon: Phone01,
    title: 'Mobile Apps',
    description: 'Integrate your agent into iOS, Android, or React Native applications.',
  },
  {
    icon: MessageChatCircle,
    title: 'Slack / Discord',
    description: 'Create team chatbots that respond in your favorite communication tools.',
  },
  {
    icon: PhoneCall01,
    title: 'Voice / Telephony',
    description: 'Connect with Twilio, call centers, or voice assistants for phone support.',
  },
  {
    icon: RefreshCcw01,
    title: 'Automation',
    description: 'Trigger agent responses from workflows, ticket systems, or Zapier.',
  },
  {
    icon: Tool02,
    title: 'Testing',
    description: 'Programmatically test your agent with automated scripts and CI/CD.',
  },
];

export const ApiUseCasesModal = ({ open, onOpenChange, agentId, apiEndpoint }: ApiUseCasesModalProps) => {
  const exampleCurl = `curl -X POST "${apiEndpoint}" \\
  -H "Authorization: Bearer cpk_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentId": "${agentId}",
    "messages": [
      {"role": "user", "content": "Hello, how can you help me?"}
    ]
  }'`;

  const exampleResponse = `{
  "conversationId": "uuid-of-conversation",
  "response": "Hi! I'm here to help. How can I assist you today?",
  "userMessageId": "uuid-of-user-message",
  "assistantMessageId": "uuid-of-assistant-message"
}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>What can you do with the API?</DialogTitle>
          <DialogDescription>
            Use your API key to integrate this agent anywhere you need conversational AI.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Use Cases Grid */}
          <div className="grid grid-cols-2 gap-3">
            {useCases.map((useCase) => (
              <div 
                key={useCase.title}
                className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-primary/10">
                    <useCase.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-0.5">{useCase.title}</h4>
                    <p className="text-xs text-muted-foreground">{useCase.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Example Request */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Example Request</h4>
              <CopyButton content={exampleCurl} showToast toastMessage="cURL command copied" />
            </div>
            <pre className="p-3 rounded-lg bg-muted text-xs font-mono overflow-x-auto border">
              {exampleCurl}
            </pre>
          </div>

          {/* Example Response */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Example Response</h4>
            <pre className="p-3 rounded-lg bg-muted text-xs font-mono overflow-x-auto border">
              {exampleResponse}
            </pre>
          </div>

          {/* Rate Limits Info */}
          <div className="p-4 rounded-lg bg-info/10 border border-info/20">
            <h4 className="text-sm font-medium text-info mb-1">Rate Limits</h4>
            <p className="text-xs text-muted-foreground">
              Each API key has configurable rate limits (default: 60/min, 10,000/day). 
              Exceeding limits returns a 429 status code. Widget requests from your embedded 
              chat are not affected by API key rate limits.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};