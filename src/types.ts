export type GeminiModelId =
  | 'gemini-3.8-flash'
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.1-flash-lite'
  | 'gemini-flash-latest'
  | string;

export type AccuracyPreset =
  | 'max_precision'
  | 'deep_thinking'
  | 'balanced'
  | 'fast_prototype';

export type ThinkingLevelOption = 'HIGH' | 'LOW' | 'MINIMAL';

export type TokenTier = '1M' | '10M' | '20M';

export interface CdkRecord {
  code: string;
  name: string;
  tier: string;
  tokensTotal: number;
  tokensUsed: number;
  accuracyTier: string;
  status: 'active' | 'redeemed' | 'revoked' | 'expired';
  maxRedemptions: number;
  redeemedCount: number;
  generatedApiKeys: string[];
  createdAt: string;
  expiresAt: string;
  note?: string;
}

export interface ApiKeyRecord {
  apiKey: string;
  cdk: string;
  name: string;
  tier: string;
  tokensTotal: number;
  tokensUsed: number;
  status: 'active' | 'revoked';
  createdAt: string;
  expiresAt: string;
  lastUsedAt?: string;
}

export interface ApiKeyDetails {
  valid: boolean;
  status: 'active' | 'revoked' | 'expired' | 'exhausted' | 'invalid';
  type?: 'generated_api_key' | 'direct_cdk' | 'direct_gemini_key';
  apiKey?: string;
  cdk?: string;
  name?: string;
  tier?: string;
  tokensTotal: number;
  tokensUsed: number;
  tokensRemaining: number;
  usagePercent: number;
  expiresAt: string;
  isExpired: boolean;
  expiresInSeconds?: number;
  lastUsedAt?: string | null;
  createdAt?: string;
  serverTime?: string;
  error?: string;
}

export interface DiagnosticResult {
  success: boolean;
  status: string;
  message: string;
  gateway?: {
    status: string;
    baseUrl: string;
    testedModel: string;
    latencyMs: number;
    protocol: string;
    httpStatus: number;
  };
  inspection?: ApiKeyDetails;
  testResponse?: string;
  timestamp?: string;
}

export interface AdminStats {
  totalCdks: number;
  totalTokensAllocated: number;
  totalTokensConsumed: number;
  activeApiKeysCount: number;
}

export interface RedeemedLicense {
  cdk: string;
  tier: string;
  name: string;
  tokensGranted: number;
  tokensUsed: number;
  accuracyTier: string;
  generatedApiKey: string;
  expiresAt: string;
  redeemedAt: string;
}

export interface RepositoryFile {
  path: string;
  name: string;
  content: string;
  language: string;
  isDirty?: boolean;
  originalContent?: string;
}

export interface PatchChange {
  id: string;
  filePath: string;
  description: string;
  originalCode: string;
  modifiedCode: string;
  status: 'pending' | 'applied' | 'rejected';
}

export interface ToolCallTrace {
  toolName: string;
  status: 'running' | 'completed' | 'failed';
  arguments: Record<string, any>;
  outputSummary: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  modelUsed?: string;
  tokensUsed?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  toolCalls?: ToolCallTrace[];
  suggestedPatches?: PatchChange[];
}

export interface EncryptedPayload {
  version: number;
  salt: string; // Base64
  iv: string;   // Base64
  ciphertext: string; // Base64
  timestamp: string;
}

export interface SessionHistory {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  activeFile?: string;
  isEncrypted: boolean;
  encryptedPayload?: EncryptedPayload;
}

export interface CollabPeer {
  id: string;
  name: string;
  avatarColor: string;
  cursorFile?: string;
  cursorLine?: number;
  lastActive: number;
}

export interface AccuracySettings {
  model: GeminiModelId;
  preset: AccuracyPreset;
  thinkingLevel: ThinkingLevelOption;
  temperature: number;
  topP: number;
  topK: number;
  strictSyntaxValidation: boolean;
  customSystemInstruction: string;
}

export interface ApiConfiguration {
  apiBaseUrl: string;
  customApiKey: string;
  useCustomKey: boolean;
}
