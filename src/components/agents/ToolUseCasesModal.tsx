import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Cloud01, 
  Calendar, 
  ShoppingCart01, 
  SearchRefraction, 
  Mail01, 
  Tool02,
  ChevronDown,
  ChevronUp
} from '@untitledui/icons';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

interface ToolUseCasesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const useCases = [
  {
    icon: Cloud01,
    title: 'Weather & Data',
    description: 'Fetch live weather, stock prices, or any real-time data from external APIs.',
  },
  {
    icon: Calendar,
    title: 'Calendar / Booking',
    description: 'Check availability, create appointments, or manage reservations.',
  },
  {
    icon: ShoppingCart01,
    title: 'E-commerce',
    description: 'Look up product inventory, prices, order status, or process returns.',
  },
  {
    icon: SearchRefraction,
    title: 'Search / Lookup',
    description: 'Query your database, search systems, or retrieve customer records.',
  },
  {
    icon: Mail01,
    title: 'Notifications',
    description: 'Send emails, SMS messages, or push notifications to users.',
  },
  {
    icon: Tool02,
    title: 'Custom Actions',
    description: 'Trigger any action in your system - CRM updates, ticket creation, etc.',
  },
];

const exampleToolDefinition = `{
  "type": "object",
  "properties": {
    "product_id": {
      "type": "string",
      "description": "The product ID to check"
    },
    "include_variants": {
      "type": "boolean",
      "description": "Whether to include variant stock"
    }
  },
  "required": ["product_id"]
}`;

export const ToolUseCasesModal = ({ open, onOpenChange }: ToolUseCasesModalProps) => {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showExample, setShowExample] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>What can Custom Tools do?</DialogTitle>
          <DialogDescription>
            Tools let your agent fetch real-time data or trigger actions by calling your APIs when needed.
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

          {/* How it Works */}
          <Collapsible open={showHowItWorks} onOpenChange={setShowHowItWorks}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
                <span className="text-sm font-medium">How it works</span>
                {showHowItWorks ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="p-4 rounded-lg bg-muted/30 border space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">1</span>
                  <p className="text-sm text-muted-foreground">User asks: <span className="text-foreground">"What's the weather in NYC?"</span></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">2</span>
                  <p className="text-sm text-muted-foreground">Agent decides to use your <code className="text-xs bg-muted px-1 py-0.5 rounded">weather_lookup</code> tool</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">3</span>
                  <div className="text-sm text-muted-foreground">
                    <p>Pilot calls your endpoint:</p>
                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
{`POST https://your-api.com/weather
Body: {"location": "NYC"}`}
                    </pre>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">4</span>
                  <div className="text-sm text-muted-foreground">
                    <p>Your endpoint returns:</p>
                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
{`{"temp": "72°F", "conditions": "Sunny"}`}
                    </pre>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">5</span>
                  <p className="text-sm text-muted-foreground">Agent responds: <span className="text-foreground">"It's currently 72°F and sunny in NYC!"</span></p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Example Tool Definition */}
          <Collapsible open={showExample} onOpenChange={setShowExample}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
                <span className="text-sm font-medium">Example tool definition</span>
                {showExample ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <p className="text-xs text-muted-foreground mb-2">
                    <strong className="text-foreground">Name:</strong> check_inventory
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    <strong className="text-foreground">Description:</strong> Check product inventory levels
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    <strong className="text-foreground">Endpoint:</strong> https://api.yourstore.com/inventory
                  </p>
                  <p className="text-xs text-muted-foreground mb-1">
                    <strong className="text-foreground">Parameters (JSON Schema):</strong>
                  </p>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto border">
                    {exampleToolDefinition}
                  </pre>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Important Note */}
          <div className="p-4 rounded-lg bg-info/10 border border-info/20">
            <h4 className="text-sm font-medium text-info mb-1">Important</h4>
            <p className="text-xs text-muted-foreground">
              Your endpoint must accept POST requests with JSON body containing the tool arguments. 
              Return JSON data that the agent can use to formulate its response. 
              Include authentication headers if your endpoint requires them.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
