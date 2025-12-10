import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tables } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { InfoCircleIcon, InfoCircleIconFilled } from '@/components/ui/info-circle-icon';
import { LightbulbIcon, LightbulbIconFilled } from '@/components/ui/lightbulb-icon';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AgentSettingsLayout } from '@/components/agents/AgentSettingsLayout';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SavedIndicator } from '@/components/settings/SavedIndicator';
import { AgentDeploymentConfig } from '@/types/metadata';
import { usePlanLimits } from '@/hooks/usePlanLimits';

type Agent = Tables<'agents'>;

// Model capability definitions - which parameters each model supports
interface ParameterCapability {
  supported: boolean;
  min?: number;
  max?: number;
  default?: number;
}

interface ModelCapabilities {
  temperature: ParameterCapability;
  topP: ParameterCapability;
  presencePenalty: ParameterCapability;
  frequencyPenalty: ParameterCapability;
  topK: ParameterCapability;
}

const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  'google/gemini-2.5-flash': {
    temperature: { supported: true, min: 0, max: 2, default: 0.7 },
    topP: { supported: true, min: 0, max: 1, default: 1.0 },
    presencePenalty: { supported: false },
    frequencyPenalty: { supported: false },
    topK: { supported: true, min: 1, max: 64, default: 40 },
  },
  'google/gemini-2.5-pro': {
    temperature: { supported: true, min: 0, max: 2, default: 0.7 },
    topP: { supported: true, min: 0, max: 1, default: 1.0 },
    presencePenalty: { supported: false },
    frequencyPenalty: { supported: false },
    topK: { supported: true, min: 1, max: 64, default: 40 },
  },
  'anthropic/claude-sonnet-4': {
    temperature: { supported: true, min: 0, max: 1, default: 1.0 },
    topP: { supported: true, min: 0, max: 1, default: 1.0 },
    presencePenalty: { supported: false },
    frequencyPenalty: { supported: false },
    topK: { supported: true, min: 1, max: 500, default: 0 },
  },
  'anthropic/claude-3.5-haiku': {
    temperature: { supported: true, min: 0, max: 1, default: 1.0 },
    topP: { supported: true, min: 0, max: 1, default: 1.0 },
    presencePenalty: { supported: false },
    frequencyPenalty: { supported: false },
    topK: { supported: true, min: 1, max: 500, default: 0 },
  },
  'openai/gpt-4o': {
    temperature: { supported: true, min: 0, max: 2, default: 1.0 },
    topP: { supported: true, min: 0, max: 1, default: 1.0 },
    presencePenalty: { supported: true, min: -2, max: 2, default: 0 },
    frequencyPenalty: { supported: true, min: -2, max: 2, default: 0 },
    topK: { supported: false },
  },
  'openai/gpt-4o-mini': {
    temperature: { supported: true, min: 0, max: 2, default: 1.0 },
    topP: { supported: true, min: 0, max: 1, default: 1.0 },
    presencePenalty: { supported: true, min: -2, max: 2, default: 0 },
    frequencyPenalty: { supported: true, min: -2, max: 2, default: 0 },
    topK: { supported: false },
  },
  'meta-llama/llama-3.3-70b-instruct': {
    temperature: { supported: true, min: 0, max: 2, default: 0.7 },
    topP: { supported: true, min: 0, max: 1, default: 1.0 },
    presencePenalty: { supported: true, min: -2, max: 2, default: 0 },
    frequencyPenalty: { supported: true, min: -2, max: 2, default: 0 },
    topK: { supported: true, min: 1, max: 128, default: 0 },
  },
  'deepseek/deepseek-chat': {
    temperature: { supported: true, min: 0, max: 2, default: 1.0 },
    topP: { supported: true, min: 0, max: 1, default: 1.0 },
    presencePenalty: { supported: true, min: -2, max: 2, default: 0 },
    frequencyPenalty: { supported: true, min: -2, max: 2, default: 0 },
    topK: { supported: false },
  },
};

// Get capabilities for a model (with fallback to permissive defaults)
const getModelCapabilities = (model: string): ModelCapabilities => {
  return MODEL_CAPABILITIES[model] || {
    temperature: { supported: true, min: 0, max: 2, default: 0.7 },
    topP: { supported: true, min: 0, max: 1, default: 1.0 },
    presencePenalty: { supported: true, min: -2, max: 2, default: 0 },
    frequencyPenalty: { supported: true, min: -2, max: 2, default: 0 },
    topK: { supported: false },
  };
};

// Inline SVG icons for model providers
const GeminiIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 24C12 21.8 11.6 19.7 10.8 17.8C10 15.9 8.9 14.1 7.4 12.6C5.9 11.1 4.1 9.9 2.2 9.1C0.3 8.3 -1.7 7.9 -3.9 7.9C-1.7 7.9 0.3 7.5 2.2 6.7C4.1 5.9 5.9 4.7 7.4 3.2C8.9 1.7 10 -0.1 10.8 -2C11.6 -3.9 12 -6 12 -8.2C12 -6 12.4 -3.9 13.2 -2C14 -0.1 15.1 1.7 16.6 3.2C18.1 4.7 19.9 5.9 21.8 6.7C23.7 7.5 25.7 7.9 27.9 7.9C25.7 7.9 23.7 8.3 21.8 9.1C19.9 9.9 18.1 11.1 16.6 12.6C15.1 14.1 14 15.9 13.2 17.8C12.4 19.7 12 21.8 12 24Z" transform="translate(0 8)" fill="url(#gemini-gradient)"/>
    <defs>
      <linearGradient id="gemini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4285F4"/>
        <stop offset="50%" stopColor="#9B72CB"/>
        <stop offset="100%" stopColor="#D96570"/>
      </linearGradient>
    </defs>
  </svg>
);

const ClaudeIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M16.98 11.39L12 2L7.02 11.39L2 12L7.02 12.61L12 22L16.98 12.61L22 12L16.98 11.39Z" fill="#CC785C"/>
  </svg>
);

const OpenAIIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
  </svg>
);

const MetaIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a4.892 4.892 0 0 0 1.12 2.166c.549.6 1.239.96 2.039.96 1.041 0 1.99-.483 2.896-1.299.863-.778 1.682-1.86 2.454-3.154l.508-.853.504.85c.76 1.28 1.564 2.356 2.41 3.132.89.816 1.837 1.299 2.878 1.299.74 0 1.41-.296 1.943-.828.547-.543.952-1.325 1.193-2.3.147-.597.221-1.262.221-1.975 0-2.58-.711-5.263-2.064-7.323C15.015 5.299 13.279 4.03 11.3 4.03c-1.041 0-2 .493-2.9 1.325-.407.376-.796.804-1.166 1.282a14.18 14.18 0 0 0-1.164-1.279c-.9-.835-1.86-1.328-2.9-1.328h-.255zm.126 1.63c.696 0 1.377.324 2.073.95.667.599 1.316 1.455 1.93 2.527l.667 1.161.635-1.172c.627-1.158 1.292-2.035 1.97-2.603.673-.564 1.35-.863 2.03-.863 1.37 0 2.627.974 3.572 2.61 1.042 1.804 1.616 4.108 1.616 6.188 0 .61-.058 1.167-.168 1.66-.155.69-.425 1.239-.752 1.564a1.13 1.13 0 0 1-.834.354c-.597 0-1.235-.324-1.895-.922-.67-.607-1.326-1.458-1.94-2.528l-.707-1.233-.697 1.232c-.627 1.106-1.295 1.968-1.974 2.546-.673.573-1.348.89-2.035.89a1.4 1.4 0 0 1-1.088-.486 3.18 3.18 0 0 1-.72-1.418A7.058 7.058 0 0 1 1.5 14.44c0-2.098.567-4.39 1.602-6.18.937-1.621 2.178-2.6 3.555-2.6z" fill="#0081FB"/>
  </svg>
);

const DeepSeekIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#4D6BFE"/>
    <path d="M8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="2" fill="white"/>
  </svg>
);

// Helper to get model provider icon
const getModelIcon = (provider: string, size: number = 18) => {
  switch (provider) {
    case 'gemini':
      return <GeminiIcon size={size} />;
    case 'claude':
      return <ClaudeIcon size={size} />;
    case 'openai':
      return <OpenAIIcon size={size} />;
    case 'llama':
      return <MetaIcon size={size} />;
    case 'deepseek':
      return <DeepSeekIcon size={size} />;
    default:
      return null;
  }
};

const MODELS = [
  { 
    value: 'google/gemini-2.5-flash', 
    label: 'Gemini 2.5 Flash (Default)',
    provider: 'gemini',
    description: 'Balanced speed and quality. Best for most use cases.',
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30
  },
  { 
    value: 'google/gemini-2.5-pro', 
    label: 'Gemini 2.5 Pro',
    provider: 'gemini',
    description: 'Strongest reasoning and multimodal capabilities.',
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.00
  },
  { 
    value: 'anthropic/claude-sonnet-4', 
    label: 'Claude Sonnet 4',
    provider: 'claude',
    description: 'Most intelligent model with superior reasoning.',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00
  },
  { 
    value: 'anthropic/claude-3.5-haiku', 
    label: 'Claude 3.5 Haiku',
    provider: 'claude',
    description: 'Fast and efficient for quick responses.',
    inputCostPer1M: 0.80,
    outputCostPer1M: 4.00
  },
  { 
    value: 'openai/gpt-4o', 
    label: 'GPT-4o',
    provider: 'openai',
    description: 'Powerful multimodal with excellent reasoning.',
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00
  },
  { 
    value: 'openai/gpt-4o-mini', 
    label: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Fast and cost-effective alternative.',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60
  },
  { 
    value: 'meta-llama/llama-3.3-70b-instruct', 
    label: 'Llama 3.3 70B',
    provider: 'llama',
    description: 'Open-source powerhouse with great performance.',
    inputCostPer1M: 0.40,
    outputCostPer1M: 0.40
  },
  { 
    value: 'deepseek/deepseek-chat', 
    label: 'DeepSeek V3',
    provider: 'deepseek',
    description: 'Excellent reasoning at very low cost.',
    inputCostPer1M: 0.14,
    outputCostPer1M: 0.28
  },
];

interface AgentConfigureTabProps {
  agent: Agent;
  onUpdate: (id: string, updates: Partial<Agent>) => Promise<Agent | null | void>;
}

const RESPONSE_LENGTH_PRESETS = [
  { value: 'concise', label: 'Concise', tokens: 500, description: 'Short, direct answers' },
  { value: 'balanced', label: 'Balanced', tokens: 2000, description: 'Standard responses' },
  { value: 'detailed', label: 'Detailed', tokens: 4000, description: 'In-depth explanations' },
  { value: 'custom', label: 'Custom', tokens: 0, description: 'Manual control' },
];



// Map slider IDs to capability keys
type SliderCapabilityKey = 'temperature' | 'presencePenalty' | 'frequencyPenalty' | 'topP' | 'topK';

const BEHAVIOR_SLIDERS: Array<{
  id: 'temperature' | 'presence_penalty' | 'frequency_penalty' | 'top_p' | 'top_k';
  capabilityKey: SliderCapabilityKey;
  label: string;
  min: number;
  max: number;
  contextTitle: string;
  contextDescription: string;
  lowLabel: string;
  highLabel: string;
}> = [
  {
    id: 'temperature',
    capabilityKey: 'temperature',
    label: 'Temperature',
    min: 0,
    max: 2,
    contextTitle: 'Creativity vs Consistency',
    contextDescription: 'Temperature controls the randomness of your agent\'s responses. At 0, responses are highly focused and deterministic—great for factual Q&A or support. At 1+, responses become more creative and varied—ideal for brainstorming or creative writing. Most agents work well between 0.5-0.8.',
    lowLabel: 'Focused & Predictable',
    highLabel: 'Creative & Varied',
  },
  {
    id: 'top_k',
    capabilityKey: 'topK',
    label: 'Top K',
    min: 1,
    max: 64,
    contextTitle: 'Token Selection Scope',
    contextDescription: 'Top K limits the model to only consider the top K most likely tokens at each step. Lower values (1-10) make responses more focused and deterministic. Higher values allow more variety. This is Gemini\'s alternative to presence/frequency penalties for controlling response diversity.',
    lowLabel: 'Very Focused',
    highLabel: 'More Options',
  },
  {
    id: 'presence_penalty',
    capabilityKey: 'presencePenalty',
    label: 'Presence Penalty',
    min: 0,
    max: 2,
    contextTitle: 'Topic Diversity',
    contextDescription: 'Presence penalty encourages your agent to explore new topics rather than dwelling on subjects already mentioned. At 0, the agent may repeatedly reference the same topics. Higher values push the agent to introduce fresh subjects. Useful for agents that need to cover broad ground or avoid redundancy.',
    lowLabel: 'May Repeat Topics',
    highLabel: 'Explores New Topics',
  },
  {
    id: 'frequency_penalty',
    capabilityKey: 'frequencyPenalty',
    label: 'Frequency Penalty',
    min: 0,
    max: 2,
    contextTitle: 'Response Variation',
    contextDescription: 'Frequency penalty reduces word and phrase repetition within responses. At 0, the agent may use the same words or phrases multiple times. Higher values encourage more varied vocabulary. Helpful for agents that generate longer content or need to sound more natural.',
    lowLabel: 'May Repeat Phrases',
    highLabel: 'Varied Vocabulary',
  },
  {
    id: 'top_p',
    capabilityKey: 'topP',
    label: 'Top P',
    min: 0,
    max: 1,
    contextTitle: 'Response Diversity (Advanced)',
    contextDescription: 'Top P (nucleus sampling) controls the pool of words the model considers for each token. At 1.0, all words are considered. Lower values restrict to only the most likely words, making output more focused. Most users should keep this at 1.0 and use Temperature instead for control.',
    lowLabel: 'Highly Focused',
    highLabel: 'Full Diversity',
  },
];

type ConfigureSection = 'identity' | 'model-behavior' | 'prompt';

const CONFIGURE_MENU_ITEMS: { id: ConfigureSection; label: string; description: string }[] = [
  { id: 'identity', label: 'Identity', description: 'Set your agent\'s name, description, and activation status' },
  { id: 'model-behavior', label: 'Model & Behavior', description: 'Choose your AI model and fine-tune response creativity' },
  { id: 'prompt', label: 'System Prompt', description: 'Define your agent\'s personality, role, and communication style' },
];

const calculateEstimatedCost = (model: string, maxTokens: number) => {
  const modelData = MODELS.find(m => m.value === model);
  if (!modelData) return null;
  
  const avgInputTokens = 500;
  const inputCost = (avgInputTokens / 1_000_000) * modelData.inputCostPer1M;
  const outputCost = (maxTokens / 1_000_000) * modelData.outputCostPer1M;
  
  return {
    perRequest: inputCost + outputCost,
    per1000Requests: (inputCost + outputCost) * 1000,
    tier: (inputCost + outputCost) < 0.001 ? 'Budget' : (inputCost + outputCost) < 0.005 ? 'Standard' : 'Premium'
  };
};

export const AgentConfigureTab: React.FC<AgentConfigureTabProps> = ({ agent, onUpdate }) => {
  const [activeSection, setActiveSection] = useState<ConfigureSection>('identity');
  const { planName } = usePlanLimits();
  const isEnterprise = planName?.toLowerCase() === 'enterprise';
  const [activeSlider, setActiveSlider] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout>();
  const deploymentConfig = (agent.deployment_config || {}) as AgentDeploymentConfig;
  
  const getInitialPreset = () => {
    const tokens = agent.max_tokens || 2000;
    if (tokens === 500) return 'concise';
    if (tokens === 2000) return 'balanced';
    if (tokens === 4000) return 'detailed';
    return 'custom';
  };

  const [formData, setFormData] = useState({
    name: agent.name,
    description: agent.description || '',
    model: agent.model,
    temperature: agent.temperature || 0.7,
    max_tokens: agent.max_tokens || 2000,
    status: agent.status,
    top_p: deploymentConfig.top_p || 1.0,
    presence_penalty: deploymentConfig.presence_penalty || 0,
    frequency_penalty: deploymentConfig.frequency_penalty || 0,
    top_k: deploymentConfig.top_k || 40,
    response_length_preset: getInitialPreset(),
    system_prompt: agent.system_prompt,
  });

  // Reset form when agent changes
  useEffect(() => {
    const config = (agent.deployment_config || {}) as AgentDeploymentConfig;
    setFormData({
      name: agent.name,
      description: agent.description || '',
      model: agent.model,
      temperature: agent.temperature || 0.7,
      max_tokens: agent.max_tokens || 2000,
      status: agent.status,
      top_p: config.top_p || 1.0,
      presence_penalty: config.presence_penalty || 0,
      frequency_penalty: config.frequency_penalty || 0,
      top_k: config.top_k || 40,
      response_length_preset: getInitialPreset(),
      system_prompt: agent.system_prompt,
    });
  }, [agent.id]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const saveToDatabase = async (data: typeof formData) => {
    const { top_p, presence_penalty, frequency_penalty, top_k, response_length_preset, system_prompt, ...coreFields } = data;
    await onUpdate(agent.id, {
      ...coreFields,
      system_prompt,
      deployment_config: {
        ...deploymentConfig,
        top_p,
        presence_penalty,
        frequency_penalty,
        top_k,
      },
    });
    setShowSaved(true);
  };

  const handleUpdate = (updates: Partial<typeof formData>) => {
    let newFormData = { ...formData, ...updates };
    
    if (updates.response_length_preset && updates.response_length_preset !== 'custom') {
      const preset = RESPONSE_LENGTH_PRESETS.find(p => p.value === updates.response_length_preset);
      if (preset) {
        newFormData.max_tokens = preset.tokens;
      }
    }
    
    if (updates.max_tokens !== undefined && updates.response_length_preset === undefined) {
      const matchingPreset = RESPONSE_LENGTH_PRESETS.find(p => p.tokens === updates.max_tokens);
      if (!matchingPreset || matchingPreset.value === 'custom') {
        newFormData.response_length_preset = 'custom';
      } else {
        newFormData.response_length_preset = matchingPreset.value;
      }
    }
    
    setFormData(newFormData);

    // Debounced auto-save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveToDatabase(newFormData);
    }, 1000);
  };

  const costEstimate = calculateEstimatedCost(formData.model, formData.max_tokens);

  const renderIdentitySection = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name">Agent Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          placeholder="e.g., Customer Support Bot"
          className="mt-1.5"
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleUpdate({ description: e.target.value })}
          placeholder="Brief description of what this agent does"
          className="mt-1.5 min-h-[80px]"
        />
      </div>
      
      <SavedIndicator show={showSaved} className="mt-2" />
    </div>
  );

  const renderModelBehaviorSection = () => {
    const capabilities = getModelCapabilities(formData.model);
    const selectedModel = MODELS.find(m => m.value === formData.model);
    
    // Filter sliders based on model capabilities
    const supportedSliders = BEHAVIOR_SLIDERS.filter(slider => {
      const cap = capabilities[slider.capabilityKey];
      return cap?.supported !== false;
    });
    
    const currentSliderInfo = supportedSliders.find(s => s.id === activeSlider);
    
    // Get slider range from model capabilities
    const getSliderRange = (slider: typeof BEHAVIOR_SLIDERS[0]) => {
      const cap = capabilities[slider.capabilityKey];
      if (cap?.supported) {
        return { min: cap.min ?? slider.min, max: cap.max ?? slider.max };
      }
      return { min: slider.min, max: slider.max };
    };
    
    // Get default value from model capabilities
    const getDefaultValue = (slider: typeof BEHAVIOR_SLIDERS[0]) => {
      const cap = capabilities[slider.capabilityKey];
      return cap?.default ?? (slider.id === 'temperature' ? 0.7 : slider.id === 'top_p' ? 1.0 : 0);
    };

    return (
      <div className="flex gap-8">
        {/* Main content column */}
        <div className="flex-1 space-y-8">
          {/* Model Selection Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="model">AI Model</Label>
              <Select
                value={formData.model}
                onValueChange={(value) => handleUpdate({ model: value })}
              >
                <SelectTrigger id="model" className="mt-1.5">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {getModelIcon(MODELS.find(m => m.value === formData.model)?.provider || '')}
                      <span>{MODELS.find(m => m.value === formData.model)?.label || formData.model}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      <div className="flex items-start gap-2.5">
                        <div className="flex-shrink-0 mt-0.5">
                          {getModelIcon(model.provider)}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{model.label}</span>
                          <span className="text-xs text-muted-foreground">{model.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="response-length">Response Length</Label>
              <Select
                value={formData.response_length_preset}
                onValueChange={(value) => handleUpdate({ response_length_preset: value })}
              >
                <SelectTrigger id="response-length" className="mt-1.5">
                  <SelectValue>
                    {RESPONSE_LENGTH_PRESETS.find(p => p.value === formData.response_length_preset)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {RESPONSE_LENGTH_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{preset.label}</span>
                        <span className="text-xs text-muted-foreground">{preset.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.response_length_preset === 'custom' && (
              <div>
                <div className="flex items-center gap-1">
                  <Label htmlFor="max_tokens">Max Tokens (Advanced)</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex group">
                        <InfoCircleIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <InfoCircleIconFilled className="h-3.5 w-3.5 text-muted-foreground" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Maximum response length in tokens. ~4 characters per token.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="max_tokens"
                  type="number"
                  min={100}
                  max={32000}
                  step={100}
                  value={formData.max_tokens ?? 2000}
                  onChange={(e) => handleUpdate({ max_tokens: parseInt(e.target.value) })}
                  className="mt-1.5"
                />
              </div>
            )}

            {isEnterprise && costEstimate && (
              <Card className="p-4 bg-accent/50 border-border">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-foreground">Estimated Cost</h4>
                  <Badge variant={costEstimate.tier === 'Budget' ? 'secondary' : costEstimate.tier === 'Standard' ? 'default' : 'destructive'}>
                    {costEstimate.tier}
                  </Badge>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Per request:</span>
                    <span className="font-medium text-foreground">${costEstimate.perRequest.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Per 1,000 requests:</span>
                    <span className="font-medium text-foreground">${costEstimate.per1000Requests.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                    Based on ~500 input tokens per request
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Behavior Controls Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-normal">
                {selectedModel?.label || formData.model}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {supportedSliders.length} behavior controls available
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={formData.model}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {supportedSliders.map((slider) => {
                  const range = getSliderRange(slider);
                  const defaultValue = getDefaultValue(slider);
                  const currentValue = formData[slider.id] ?? defaultValue;
                  
                  return (
                    <div 
                      key={slider.id} 
                      className="space-y-3"
                      onMouseEnter={() => setActiveSlider(slider.id)}
                      onMouseLeave={() => setActiveSlider(null)}
                    >
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">{slider.label}</Label>
                        <span className="text-sm font-medium tabular-nums text-muted-foreground">
                          {typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue}
                        </span>
                      </div>
                      <Slider
                        value={[typeof currentValue === 'number' ? currentValue : 0]}
                        onValueChange={([value]) => handleUpdate({ [slider.id]: value })}
                        min={range.min}
                        max={range.max}
                        step={0.01}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{slider.lowLabel}</span>
                        <span>{slider.highLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
          
          <SavedIndicator show={showSaved} className="mt-2" />
        </div>
        
        {/* Right column: Contextual info panel */}
        <div className="w-72 flex-shrink-0 hidden lg:block">
          <div className="sticky top-8 p-4 rounded-lg bg-accent/30 border border-border/50">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlider || 'default'}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
              >
                {currentSliderInfo ? (
                  <>
                    <h4 className="text-sm font-semibold text-foreground mb-2">
                      {currentSliderInfo.contextTitle}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {currentSliderInfo.contextDescription}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Hover over a slider to see detailed information about how it affects your agent's behavior.
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  };

  const renderPromptSection = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="system_prompt">System Prompt</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex group">
                <LightbulbIcon className="h-4 w-4 text-amber-500" />
                <LightbulbIconFilled className="h-4 w-4 text-amber-500" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium mb-1">Tips for great prompts:</p>
              <ul className="text-xs text-muted-foreground marker:text-muted-foreground/60 space-y-1 list-disc list-inside">
                <li>Be specific about the agent's role and expertise</li>
                <li>Define the tone and communication style</li>
                <li>Include any rules or limitations</li>
                <li>Specify how to handle edge cases</li>
                <li>Add examples of desired behavior</li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </div>

        <Textarea
          id="system_prompt"
          value={formData.system_prompt}
          onChange={(e) => handleUpdate({ system_prompt: e.target.value })}
          placeholder="You are a helpful assistant that..."
          className="min-h-[300px] font-mono text-sm"
        />
      </div>
      
      <SavedIndicator show={showSaved} className="mt-2" />
    </div>
  );

  return (
    <TooltipProvider>
      <AgentSettingsLayout
        activeTab={activeSection}
        onTabChange={(tab) => setActiveSection(tab as ConfigureSection)}
        menuItems={CONFIGURE_MENU_ITEMS}
        title="Configure"
        description={CONFIGURE_MENU_ITEMS.find(item => item.id === activeSection)?.description || ''}
      >
        {activeSection === 'identity' && renderIdentitySection()}
        {activeSection === 'model-behavior' && renderModelBehaviorSection()}
        {activeSection === 'prompt' && renderPromptSection()}
      </AgentSettingsLayout>
    </TooltipProvider>
  );
};
