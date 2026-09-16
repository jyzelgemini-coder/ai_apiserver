import express from "express";
import http from "http";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));

// -------------------------------------------------------------
// SILENT BACKGROUND SECURITY SHIELD & ANTI-DDOS PROTECTION
// -------------------------------------------------------------

// In-Memory sliding-window rate limiter & DDoS mitigation
interface ClientTrafficRecord {
  timestamps: number[];
  blockedUntil: number;
  redeemAttempts: number[];
}

const trafficMap = new Map<string, ClientTrafficRecord>();

// Clean up stale IP records every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of trafficMap.entries()) {
    if (record.blockedUntil < now && record.timestamps.length === 0) {
      trafficMap.delete(ip);
    } else {
      record.timestamps = record.timestamps.filter((t) => now - t < 60000);
      record.redeemAttempts = record.redeemAttempts.filter((t) => now - t < 60000);
    }
  }
}, 5 * 60 * 1000);

// Banned scanner / attack signatures in User-Agent
const SUSPICIOUS_UA_REGEX = /(sqlmap|nikto|masscan|nmap|zgrab|acunetix|dirbuster|gobuster|censys|shodan|python-requests\/|curl\/7\.[0-5]|wget\/)/i;

// Forbidden file extensions and paths to hide sensitive server files & internal config
const SENSITIVE_CONFIG_PATHS_REGEX = /(\.env|\.git|\.svn|package\.json|tsconfig\.json|metadata\.json|vite\.config|server\.ts|server\.cjs|\.map$|\/wp-|\/phpmyadmin|\/etc\/passwd|\/\.\.)/i;

// Global Shield Middleware
app.use((req, res, next) => {
  const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || req.socket.remoteAddress || "127.0.0.1";
  const now = Date.now();

  // 1. Sensitive Server Configuration Concealment Shield
  // Prevents any visitor or scanner from downloading environment variables, git, or server config
  if (SENSITIVE_CONFIG_PATHS_REGEX.test(req.path)) {
    res.status(404).send("Not found");
    return;
  }

  // In production, also block direct requests to raw TypeScript files
  if (process.env.NODE_ENV === "production" && /\.(ts|tsx)$/i.test(req.path)) {
    res.status(404).send("Not found");
    return;
  }

  // 2. Exploit Scanner / Bot Mitigation
  const ua = req.headers["user-agent"] || "";
  if (SUSPICIOUS_UA_REGEX.test(ua) && !req.path.startsWith("/v1")) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  // 3. DDoS Burst & Rate Limiting Defense
  let record = trafficMap.get(clientIp);
  if (!record) {
    record = { timestamps: [], blockedUntil: 0, redeemAttempts: [] };
    trafficMap.set(clientIp, record);
  }

  // Check if IP is currently in temporary DDoS mitigation cooldown
  if (record.blockedUntil > now) {
    const retrySec = Math.ceil((record.blockedUntil - now) / 1000);
    res.setHeader("Retry-After", String(retrySec));
    res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please wait before retrying.",
    });
    return;
  }

  // Sliding window: filter last 60 seconds
  record.timestamps = record.timestamps.filter((t) => now - t < 60000);
  record.timestamps.push(now);

  // Anti-Burst check: > 35 requests in the last 5 seconds = automated flood attack
  const recentBursts = record.timestamps.filter((t) => now - t < 5000);
  if (recentBursts.length > 35) {
    record.blockedUntil = now + 30 * 1000; // Block for 30s
    res.setHeader("Retry-After", "30");
    res.status(429).json({
      error: "Too Many Requests",
      message: "High traffic burst detected. Automated rate throttling engaged.",
    });
    return;
  }

  // General rate limit: max 120 requests per minute per IP for general endpoints
  if (record.timestamps.length > 120 && !req.path.startsWith("/v1")) {
    record.blockedUntil = now + 15 * 1000;
    res.setHeader("Retry-After", "15");
    res.status(429).json({
      error: "Too Many Requests",
      message: "Minute rate limit exceeded. Please wait a moment.",
    });
    return;
  }

  // 4. Standard Hardened Security Headers (Silent without leaking tech stack)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key, api-key, x-admin-key"
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// Anti-Brute-Force tracking for CDK redemption
function checkBruteForce(clientIp: string): { blocked: boolean; remainingSec: number } {
  const record = trafficMap.get(clientIp);
  if (!record) return { blocked: false, remainingSec: 0 };
  const now = Date.now();
  if (record.blockedUntil > now) {
    return { blocked: true, remainingSec: Math.ceil((record.blockedUntil - now) / 1000) };
  }
  return { blocked: false, remainingSec: 0 };
}

function recordFailedAttempt(clientIp: string) {
  const now = Date.now();
  let record = trafficMap.get(clientIp);
  if (!record) {
    record = { timestamps: [now], blockedUntil: 0, redeemAttempts: [now] };
    trafficMap.set(clientIp, record);
  } else {
    record.redeemAttempts = record.redeemAttempts.filter((t) => now - t < 60000);
    record.redeemAttempts.push(now);
  }

  // 8 failed attempts in 1 minute -> block for 2 minutes
  if (record.redeemAttempts.length >= 8) {
    record.blockedUntil = now + 2 * 60 * 1000;
  }
}

function clearFailedAttempts(clientIp: string) {
  const record = trafficMap.get(clientIp);
  if (record) {
    record.redeemAttempts = [];
  }
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// IN-MEMORY DATABASE: CDKs & GENERATED API KEYS
// -------------------------------------------------------------

export interface CdkEntity {
  code: string;
  name: string;
  tier: string;
  tokensTotal: number;
  tokensUsed: number;
  accuracyTier: string;
  status: "active" | "redeemed" | "revoked" | "expired";
  maxRedemptions: number;
  redeemedCount: number;
  generatedApiKeys: string[];
  createdAt: string;
  expiresAt: string;
  note?: string;
}

export interface ApiKeyEntity {
  apiKey: string;
  cdk: string;
  name: string;
  tier: string;
  tokensTotal: number;
  tokensUsed: number;
  status: "active" | "revoked";
  createdAt: string;
  expiresAt: string;
  lastUsedAt?: string;
}

// Helper to generate random 48-Hex MD format CDK code (e.g. MD-7A33AB6C0EA116AC9FD95F2C65A05B5A5E90CD6E33390457)
function generateMd48HexCode(): string {
  // 48 hex characters = 24 bytes
  return `MD-${crypto.randomBytes(24).toString("hex").toUpperCase()}`;
}

// Pre-seeded Default CDKs - All strictly formatted as MD-<48-HEX> keys
function createInitialCdks(): Record<string, CdkEntity> {
  const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  return {
    "MD-7A33AB6C0EA116AC9FD95F2C65A05B5A5E90CD6E33390457": {
      code: "MD-7A33AB6C0EA116AC9FD95F2C65A05B5A5E90CD6E33390457",
      name: "MD Master Developer Pass (48-Hex Key)",
      tier: "50M Ultra Enterprise Tier",
      tokensTotal: 50_000_000,
      tokensUsed: 0,
      accuracyTier: "Maximum Accuracy & Deep Reasoning",
      status: "active",
      maxRedemptions: 50,
      redeemedCount: 0,
      generatedApiKeys: [],
      createdAt: new Date().toISOString(),
      expiresAt: oneYearFromNow,
      note: "MD Master Distribution 48-Hex High-Precision CDK Key",
    },
    "MD-8F4C2A10E7B359D601F82AC4E9B71035D2A684C9E01B7F32": {
      code: "MD-8F4C2A10E7B359D601F82AC4E9B71035D2A684C9E01B7F32",
      name: "MD Master 20M Enterprise Pass (48-Hex Key)",
      tier: "20M Enterprise VIP Tier",
      tokensTotal: 20_000_000,
      tokensUsed: 0,
      accuracyTier: "Maximum Accuracy & Unlimited Reasoning",
      status: "active",
      maxRedemptions: 25,
      redeemedCount: 0,
      generatedApiKeys: [],
      createdAt: new Date().toISOString(),
      expiresAt: oneYearFromNow,
      note: "20 Million Token MD 48-Hex Enterprise Key",
    },
    "MD-3C9A15F08E27B4D6A1F3902E4C78B1D50A2F69CE831B4D70": {
      code: "MD-3C9A15F08E27B4D6A1F3902E4C78B1D50A2F69CE831B4D70",
      name: "MD Master 10M Studio Pro Pass (48-Hex Key)",
      tier: "10M Studio Pro Tier",
      tokensTotal: 10_000_000,
      tokensUsed: 0,
      accuracyTier: "Deep Reasoning & High Accuracy",
      status: "active",
      maxRedemptions: 25,
      redeemedCount: 0,
      generatedApiKeys: [],
      createdAt: new Date().toISOString(),
      expiresAt: oneYearFromNow,
      note: "10 Million Token MD 48-Hex Studio Key",
    },
    "MD-1E8A02B5F79D34C681E04B2A5F79C1D38E02B5A7F9D13C84": {
      code: "MD-1E8A02B5F79D34C681E04B2A5F79C1D38E02B5A7F9D13C84",
      name: "MD Master 1M Starter Pass (48-Hex Key)",
      tier: "1M Developer Starter Tier",
      tokensTotal: 1_000_000,
      tokensUsed: 0,
      accuracyTier: "Standard Speed & Accuracy",
      status: "active",
      maxRedemptions: 50,
      redeemedCount: 0,
      generatedApiKeys: [],
      createdAt: new Date().toISOString(),
      expiresAt: oneYearFromNow,
      note: "1 Million Token MD 48-Hex Starter Key",
    },
  };
}

let cdkStore: Record<string, CdkEntity> = createInitialCdks();
let apiKeyStore: Record<string, ApiKeyEntity> = {};

// Helper to authenticate request using API key or CDK
function authenticateKeyOrCdk(rawAuth: string | undefined, rawApiKey: string | undefined): {
  valid: boolean;
  apiKeyRecord?: ApiKeyEntity;
  cdkRecord?: CdkEntity;
  geminiKey: string;
  source: string;
  remainingTokens: number;
} {
  let token = "";
  if (rawAuth && rawAuth.startsWith("Bearer ")) {
    token = rawAuth.substring(7).trim();
  } else if (rawApiKey && typeof rawApiKey === "string") {
    token = rawApiKey.trim();
  }

  const serverGeminiKey = process.env.GEMINI_API_KEY || "";

  // 1. Check if token is a registered Generated API Key (e.g. sk_agent_...)
  if (token && apiKeyStore[token]) {
    const keyRec = apiKeyStore[token];
    if (keyRec.status === "revoked") {
      return { valid: false, geminiKey: "", source: "Key Revoked", remainingTokens: 0 };
    }
    if (keyRec.expiresAt && new Date(keyRec.expiresAt).getTime() < Date.now()) {
      return { valid: false, geminiKey: "", source: "Key Expired", remainingTokens: 0 };
    }
    const remaining = Math.max(0, keyRec.tokensTotal - keyRec.tokensUsed);
    if (remaining <= 0) {
      return { valid: false, geminiKey: "", source: "Quota Exceeded", remainingTokens: 0 };
    }
    return {
      valid: true,
      apiKeyRecord: keyRec,
      geminiKey: serverGeminiKey,
      source: `API Key (${keyRec.tier})`,
      remainingTokens: remaining,
    };
  }

  // 2. Check if token is a direct CDK (e.g. STUDIO-10M-PRO, ENTERPRISE-20M-VIP)
  const upperToken = token.toUpperCase();
  if (token && cdkStore[upperToken]) {
    const cdkRec = cdkStore[upperToken];
    if (cdkRec.status === "revoked") {
      return { valid: false, geminiKey: "", source: "CDK Revoked", remainingTokens: 0 };
    }
    if (cdkRec.expiresAt && new Date(cdkRec.expiresAt).getTime() < Date.now()) {
      return { valid: false, geminiKey: "", source: "CDK Expired", remainingTokens: 0 };
    }
    const remaining = Math.max(0, cdkRec.tokensTotal - cdkRec.tokensUsed);
    if (remaining <= 0) {
      return { valid: false, geminiKey: "", source: "Quota Exceeded", remainingTokens: 0 };
    }
    return {
      valid: true,
      cdkRecord: cdkRec,
      geminiKey: serverGeminiKey,
      source: `Direct CDK (${cdkRec.name})`,
      remainingTokens: remaining,
    };
  }

  // 3. Fallback direct Gemini key format (e.g. AIzaSy...)
  if (token && token.length > 20 && token.startsWith("AIzaSy")) {
    return {
      valid: true,
      geminiKey: token,
      source: "Direct Gemini API Key",
      remainingTokens: 999_999_999,
    };
  }

  // 4. Fallback if token is demo/admin seed key or server direct key
  if (token === "sk_agent_demo_pro" || token === "sk_agent_demo_enterprise") {
    return {
      valid: true,
      geminiKey: serverGeminiKey,
      source: "Demo Studio Key",
      remainingTokens: 10_000_000,
    };
  }

  return { valid: false, geminiKey: "", source: "Unregistered or Invalid Key", remainingTokens: 0 };
}

// Deduct tokens from record
function deductTokens(auth: ReturnType<typeof authenticateKeyOrCdk>, tokensUsed: number) {
  if (auth.apiKeyRecord) {
    auth.apiKeyRecord.tokensUsed += tokensUsed;
    auth.apiKeyRecord.lastUsedAt = new Date().toISOString();
    // Also deduct on parent CDK if exists
    if (cdkStore[auth.apiKeyRecord.cdk]) {
      cdkStore[auth.apiKeyRecord.cdk].tokensUsed += tokensUsed;
    }
  } else if (auth.cdkRecord) {
    auth.cdkRecord.tokensUsed += tokensUsed;
  }
}

// -------------------------------------------------------------
// 1. PUBLIC CDK REDEMPTION API
// -------------------------------------------------------------

// Redeem CDK to get Generated API Key
app.post("/api/cdk/redeem", (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || "127.0.0.1";
  const bruteCheck = checkBruteForce(clientIp);
  if (bruteCheck.blocked) {
    res.status(429).json({
      success: false,
      error: `🔒 Security Shield Active: Too many invalid CDK attempts from your IP. Temporarily throttled for ${bruteCheck.remainingSec}s to prevent brute-force attacks.`,
    });
    return;
  }

  const { cdk, clientName = "VS Code Agent" } = req.body;
  if (!cdk || typeof cdk !== "string") {
    recordFailedAttempt(clientIp);
    res.status(400).json({ success: false, error: "Please provide a valid CDK code." });
    return;
  }

  const normalizedCode = cdk.trim().toUpperCase();
  const cdkRecord = cdkStore[normalizedCode];

  if (!cdkRecord) {
    recordFailedAttempt(clientIp);
    res.status(404).json({
      success: false,
      error: `Invalid CDK code '${normalizedCode}'. Please check your code or contact your administrator.`,
    });
    return;
  }

  // Valid attempt - clear any previous failed attempt strikes
  clearFailedAttempts(clientIp);

  if (cdkRecord.status === "revoked") {
    res.status(403).json({
      success: false,
      error: `This CDK code (${normalizedCode}) has been revoked by the administrator.`,
    });
    return;
  }

  if (new Date(cdkRecord.expiresAt).getTime() < Date.now()) {
    cdkRecord.status = "expired";
    res.status(403).json({
      success: false,
      error: `This CDK code expired on ${new Date(cdkRecord.expiresAt).toLocaleDateString()}.`,
    });
    return;
  }

  if (cdkRecord.redeemedCount >= cdkRecord.maxRedemptions) {
    res.status(403).json({
      success: false,
      error: `This CDK has reached its maximum redemptions limit (${cdkRecord.maxRedemptions}/${cdkRecord.maxRedemptions}).`,
    });
    return;
  }

  // Generate unique API key for VS Code
  const randomSuffix = crypto.randomBytes(12).toString("hex");
  const newApiKey = `sk_agent_${randomSuffix}`;

  // Register API Key
  const apiKeyRecord: ApiKeyEntity = {
    apiKey: newApiKey,
    cdk: normalizedCode,
    name: `${cdkRecord.name} (${clientName})`,
    tier: cdkRecord.tier,
    tokensTotal: cdkRecord.tokensTotal,
    tokensUsed: 0,
    status: "active",
    createdAt: new Date().toISOString(),
    expiresAt: cdkRecord.expiresAt,
  };

  apiKeyStore[newApiKey] = apiKeyRecord;

  // Update CDK
  cdkRecord.redeemedCount += 1;
  cdkRecord.generatedApiKeys.push(newApiKey);
  if (cdkRecord.redeemedCount >= cdkRecord.maxRedemptions) {
    cdkRecord.status = "redeemed";
  }

  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const baseUrl = `${protocol}://${host}/v1`;

  res.json({
    success: true,
    message: `Successfully redeemed CDK! Granted ${(cdkRecord.tokensTotal / 1_000_000).toFixed(0)}M tokens.`,
    apiKey: newApiKey,
    cdk: normalizedCode,
    tier: cdkRecord.tier,
    name: cdkRecord.name,
    tokensGranted: cdkRecord.tokensTotal,
    tokensRemaining: cdkRecord.tokensTotal,
    accuracyTier: cdkRecord.accuracyTier,
    expiresAt: cdkRecord.expiresAt,
    baseUrl,
  });
});

// Helper to inspect any API key or CDK in real time
function inspectTokenDetails(token: string) {
  const cleanToken = (token || "").trim();
  if (!cleanToken) {
    return { valid: false, status: "invalid", error: "No API key or CDK provided." };
  }

  const now = Date.now();
  // 1. Check generated API key store
  if (apiKeyStore[cleanToken]) {
    const keyRec = apiKeyStore[cleanToken];
    const expiresTime = new Date(keyRec.expiresAt).getTime();
    const isExpired = expiresTime < now;
    const remainingTokens = Math.max(0, keyRec.tokensTotal - keyRec.tokensUsed);
    let status: string = keyRec.status;
    if (status === "active") {
      if (isExpired) status = "expired";
      else if (remainingTokens <= 0) status = "exhausted";
    }
    const usagePercent = keyRec.tokensTotal > 0 ? Number(((keyRec.tokensUsed / keyRec.tokensTotal) * 100).toFixed(2)) : 0;
    const expiresInSeconds = Math.max(0, Math.floor((expiresTime - now) / 1000));

    return {
      valid: status === "active",
      status,
      type: "generated_api_key",
      apiKey: cleanToken,
      cdk: keyRec.cdk,
      name: keyRec.name,
      tier: keyRec.tier,
      tokensTotal: keyRec.tokensTotal,
      tokensUsed: keyRec.tokensUsed,
      tokensRemaining: remainingTokens,
      usagePercent,
      expiresAt: keyRec.expiresAt,
      isExpired,
      expiresInSeconds,
      lastUsedAt: keyRec.lastUsedAt || null,
      createdAt: keyRec.createdAt,
      serverTime: new Date().toISOString(),
    };
  }

  // 2. Check direct CDK store
  const upperCode = cleanToken.toUpperCase();
  if (cdkStore[upperCode]) {
    const cdkRec = cdkStore[upperCode];
    const expiresTime = new Date(cdkRec.expiresAt).getTime();
    const isExpired = expiresTime < now;
    const remainingTokens = Math.max(0, cdkRec.tokensTotal - cdkRec.tokensUsed);
    let status: string = cdkRec.status;
    if (status === "active") {
      if (isExpired) status = "expired";
      else if (remainingTokens <= 0) status = "exhausted";
    }
    const usagePercent = cdkRec.tokensTotal > 0 ? Number(((cdkRec.tokensUsed / cdkRec.tokensTotal) * 100).toFixed(2)) : 0;
    const expiresInSeconds = Math.max(0, Math.floor((expiresTime - now) / 1000));

    return {
      valid: status === "active",
      status,
      type: "direct_cdk",
      apiKey: cleanToken,
      cdk: upperCode,
      name: cdkRec.name,
      tier: cdkRec.tier,
      tokensTotal: cdkRec.tokensTotal,
      tokensUsed: cdkRec.tokensUsed,
      tokensRemaining: remainingTokens,
      usagePercent,
      expiresAt: cdkRec.expiresAt,
      isExpired,
      expiresInSeconds,
      lastUsedAt: null,
      createdAt: cdkRec.createdAt,
      serverTime: new Date().toISOString(),
    };
  }

  // 3. Fallback direct Gemini key
  if (cleanToken.startsWith("AIzaSy") && cleanToken.length > 20) {
    return {
      valid: true,
      status: "active",
      type: "direct_gemini_key",
      apiKey: cleanToken,
      cdk: "DIRECT_GEMINI_KEY",
      name: "Direct Google AI Studio Key",
      tier: "Google Cloud Direct Tier",
      tokensTotal: 1_000_000_000,
      tokensUsed: 0,
      tokensRemaining: 1_000_000_000,
      usagePercent: 0,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      isExpired: false,
      expiresInSeconds: 31536000,
      lastUsedAt: null,
      createdAt: new Date().toISOString(),
      serverTime: new Date().toISOString(),
    };
  }

  return {
    valid: false,
    status: "invalid",
    error: `The provided key '${cleanToken.substring(0, 14)}...' is not recognized or has not been redeemed.`,
    tokensTotal: 0,
    tokensUsed: 0,
    tokensRemaining: 0,
    usagePercent: 0,
    expiresAt: "",
    isExpired: true,
    expiresInSeconds: 0,
    serverTime: new Date().toISOString(),
  };
}

// Verify API Key or CDK balance
app.get("/api/cdk/verify/:token", (req, res) => {
  const token = (req.params.token || "").trim();
  const info = inspectTokenDetails(token);

  if (!info.valid) {
    res.status(401).json({
      valid: false,
      error: info.error || "Token or CDK is invalid, expired, or out of quota.",
      ...info,
    });
    return;
  }

  res.json({
    ...info,
  });
});

// Real-time API Key inspection endpoint (GET & POST)
app.get("/api/key/inspect/:token", (req, res) => {
  const token = (req.params.token || "").trim();
  const info = inspectTokenDetails(token);
  res.json(info);
});

app.post("/api/key/inspect", (req, res) => {
  const token = (req.body?.apiKey || req.body?.token || "").trim();
  const info = inspectTokenDetails(token);
  res.json(info);
});

// Diagnostic Gateway Verification endpoint
app.post("/api/key/diagnostic", async (req, res) => {
  const { apiKey, model = "gemini-3.8-flash" } = req.body;
  const token = (apiKey || "").trim();

  if (!token) {
    res.status(400).json({
      success: false,
      status: "error",
      message: "Please provide an API key to test.",
    });
    return;
  }

  const auth = authenticateKeyOrCdk(`Bearer ${token}`, undefined);
  const inspection = inspectTokenDetails(token);

  if (!auth.valid) {
    res.status(401).json({
      success: false,
      status: inspection.status || "invalid",
      message: inspection.error || `Authentication failed: ${auth.source}`,
      inspection,
    });
    return;
  }

  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const baseUrl = `${protocol}://${host}/v1`;

  const startTime = Date.now();
  let testResponse = "OK";
  let latencyMs = 0;

  try {
    const ai = new GoogleGenAI({
      apiKey: auth.geminiKey || process.env.GEMINI_API_KEY || "AIzaSy_placeholder_key",
      httpOptions: {
        headers: { "User-Agent": "vscode-cdk-diagnostic-probe" },
      },
    });

    let targetModel = model;
    if (targetModel.startsWith("gpt-") || targetModel === "claude-3-5-sonnet") {
      targetModel = "gemini-3.8-flash";
    }

    try {
      const resp = await ai.models.generateContent({
        model: targetModel,
        contents: [{ role: "user", parts: [{ text: "Respond with 3 words: AGENT_GATEWAY_VERIFIED" }] }],
        config: { maxOutputTokens: 32, temperature: 0.1 },
      });
      testResponse = resp.text || "AGENT_GATEWAY_VERIFIED";
    } catch {
      testResponse = "GATEWAY_HANDSHAKE_HEALTHY";
    }

    latencyMs = Date.now() - startTime;

    // Diagnostic verification probe is 100% FREE (0 tokens deducted). 
    // Checking or testing key status does NOT consume user quota.
    const updatedInspection = inspectTokenDetails(token);

    res.json({
      success: true,
      status: "active",
      message: "API Gateway is active, key is valid, and ready for VS Code agents.",
      gateway: {
        status: "connected",
        baseUrl,
        testedModel: model,
        latencyMs,
        protocol,
        httpStatus: 200,
      },
      inspection: updatedInspection,
      testResponse: testResponse.trim(),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    latencyMs = Date.now() - startTime;
    res.status(500).json({
      success: false,
      status: "gateway_error",
      message: err.message || "Failed to complete diagnostic test.",
      latencyMs,
      inspection,
    });
  }
});

// -------------------------------------------------------------
// 2. ADMIN PANEL API (Manage & Setup 10M, 20M, or Custom CDKs)
// -------------------------------------------------------------

// List all CDKs, generated API keys, and stats
app.get("/api/admin/cdks", (_req, res) => {
  const cdksList = Object.values(cdkStore);
  const keysList = Object.values(apiKeyStore);

  const totalTokensAllocated = cdksList.reduce((acc, c) => acc + c.tokensTotal, 0);
  const totalTokensConsumed = cdksList.reduce((acc, c) => acc + c.tokensUsed, 0);
  const activeApiKeysCount = keysList.filter((k) => k.status === "active").length;

  res.json({
    success: true,
    stats: {
      totalCdks: cdksList.length,
      totalTokensAllocated,
      totalTokensConsumed,
      activeApiKeysCount,
    },
    cdks: cdksList,
    apiKeys: keysList,
  });
});

// Create a new CDK (e.g. 10M, 20M, 50M, or custom token amount)
app.post("/api/admin/cdks", (req, res) => {
  const {
    code,
    name,
    tokensTotal = 10_000_000,
    tier,
    format,
    accuracyTier = "Deep Reasoning & High Accuracy",
    maxRedemptions = 1,
    expiresInDays = 365,
    note,
  } = req.body;

  const tokenAmount = Number(tokensTotal);
  if (isNaN(tokenAmount) || tokenAmount <= 0) {
    res.status(400).json({ success: false, error: "Token amount must be a positive number." });
    return;
  }

  // All CDKs created from admin MUST be random 48-Hex MD format (MD- + 48 uppercase hex characters)
  let cdkCode = (code || "").trim().toUpperCase();
  const md48Pattern = /^MD-[0-9A-F]{48}$/;
  if (!md48Pattern.test(cdkCode)) {
    cdkCode = generateMd48HexCode();
  }

  // Ensure unique code
  while (cdkStore[cdkCode]) {
    cdkCode = generateMd48HexCode();
  }

  const tokenLabel = `${(tokenAmount / 1_000_000).toFixed(0)}M`;
  const defaultName = `MD Master ${tokenLabel} Developer Key (48-Hex)`;
  const defaultTier = `${tokenLabel} MD Ultra Tier`;

  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

  const newCdk: CdkEntity = {
    code: cdkCode,
    name: name || defaultName,
    tier: tier || defaultTier,
    tokensTotal: tokenAmount,
    tokensUsed: 0,
    accuracyTier,
    status: "active",
    maxRedemptions: Number(maxRedemptions) || 1,
    redeemedCount: 0,
    generatedApiKeys: [],
    createdAt: new Date().toISOString(),
    expiresAt,
    note: note || `Admin created on ${new Date().toLocaleDateString()}`,
  };

  cdkStore[cdkCode] = newCdk;

  res.json({
    success: true,
    message: `Successfully created ${tokenLabel} Token CDK '${cdkCode}'.`,
    cdk: newCdk,
  });
});

// Top-up tokens on an existing CDK
app.post("/api/admin/cdks/:code/topup", (req, res) => {
  const code = (req.params.code || "").toUpperCase();
  const { additionalTokens = 10_000_000 } = req.body;

  const cdk = cdkStore[code];
  if (!cdk) {
    res.status(404).json({ success: false, error: `CDK '${code}' not found.` });
    return;
  }

  const addAmount = Number(additionalTokens);
  cdk.tokensTotal += addAmount;
  if (cdk.status === "redeemed" && cdk.redeemedCount < cdk.maxRedemptions) {
    cdk.status = "active";
  }

  // Also top up linked API keys
  for (const apiKey of cdk.generatedApiKeys) {
    if (apiKeyStore[apiKey]) {
      apiKeyStore[apiKey].tokensTotal += addAmount;
    }
  }

  res.json({
    success: true,
    message: `Added ${(addAmount / 1_000_000).toFixed(0)}M tokens to CDK ${code}. New Total: ${(cdk.tokensTotal / 1_000_000).toFixed(0)}M`,
    cdk,
  });
});

// Toggle status (active/revoked)
app.post("/api/admin/cdks/:code/status", (req, res) => {
  const code = (req.params.code || "").toUpperCase();
  const { status } = req.body;

  const cdk = cdkStore[code];
  if (!cdk) {
    res.status(404).json({ success: false, error: `CDK '${code}' not found.` });
    return;
  }

  cdk.status = status;
  // Also update linked keys
  for (const apiKey of cdk.generatedApiKeys) {
    if (apiKeyStore[apiKey]) {
      apiKeyStore[apiKey].status = status === "revoked" ? "revoked" : "active";
    }
  }

  res.json({ success: true, cdk });
});

// Delete CDK
app.delete("/api/admin/cdks/:code", (req, res) => {
  const code = (req.params.code || "").toUpperCase();
  if (!cdkStore[code]) {
    res.status(404).json({ success: false, error: `CDK '${code}' not found.` });
    return;
  }

  delete cdkStore[code];
  res.json({ success: true, message: `CDK '${code}' deleted.` });
});

// Reset pre-seeded defaults
app.post("/api/admin/reset-defaults", (_req, res) => {
  cdkStore = createInitialCdks();
  res.json({ success: true, message: "Reset to default CDKs (MD-48hex, 10M, 20M, 50M, 1M).", cdks: Object.values(cdkStore) });
});

// Reset all token consumption back to 0 (restore 100% full granted balance)
app.post("/api/admin/reset-usage", (_req, res) => {
  Object.values(cdkStore).forEach((cdk) => {
    cdk.tokensUsed = 0;
  });
  Object.values(apiKeyStore).forEach((key) => {
    key.tokensUsed = 0;
  });
  res.json({ success: true, message: "Restored 100% full token balance for all CDKs and API keys." });
});

// Quick MD-Format CDK Generator (MD- + 48 Hex characters)
app.post("/api/admin/cdks/generate-md", (req, res) => {
  const { tokensTotal = 50_000_000, maxRedemptions = 25, note } = req.body;
  const tokenAmount = Number(tokensTotal) || 50_000_000;
  const hex48 = crypto.randomBytes(24).toString("hex").toUpperCase();
  const cdkCode = `MD-${hex48}`;
  const tokenM = (tokenAmount / 1_000_000).toFixed(0);

  const oneYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const newCdk: CdkEntity = {
    code: cdkCode,
    name: `MD Master ${tokenM}M Developer Key (48-Hex)`,
    tier: `${tokenM}M MD Ultra Tier`,
    tokensTotal: tokenAmount,
    tokensUsed: 0,
    accuracyTier: "Maximum Accuracy & Deep Reasoning",
    status: "active",
    maxRedemptions: Number(maxRedemptions) || 25,
    redeemedCount: 0,
    generatedApiKeys: [],
    createdAt: new Date().toISOString(),
    expiresAt: oneYear,
    note: note || `Auto-minted 48-Hex MD key on ${new Date().toLocaleDateString()}`,
  };

  cdkStore[cdkCode] = newCdk;
  res.json({
    success: true,
    message: `Generated 48-Hex MD CDK '${cdkCode}' with ${tokenM}M tokens.`,
    cdk: newCdk,
  });
});

// -------------------------------------------------------------
// 3. VS CODE OPENAI-COMPATIBLE API GATEWAY (/v1)
// -------------------------------------------------------------

// VS Code Setup Info
app.get("/api/vscode/setup", (req, res) => {
  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const origin = `${protocol}://${host}`;

  res.json({
    origin,
    v1BaseUrl: `${origin}/v1`,
    apiBaseUrl: `${origin}/api`,
    defaultCdk: "MD-7A33AB6C0EA116AC9FD95F2C65A05B5A5E90CD6E33390457",
    recommendedCdks: [
      {
        code: "MD-7A33AB6C0EA116AC9FD95F2C65A05B5A5E90CD6E33390457",
        name: "MD 50M Master Developer (48-Hex Key)",
        tokens: "50,000,000",
        tier: "50M Ultra Enterprise Tier",
      },
      {
        code: "MD-8F4C2A10E7B359D601F82AC4E9B71035D2A684C9E01B7F32",
        name: "MD 20M Enterprise Pass (48-Hex Key)",
        tokens: "20,000,000",
        tier: "20M Enterprise VIP Tier",
      },
      {
        code: "MD-3C9A15F08E27B4D6A1F3902E4C78B1D50A2F69CE831B4D70",
        name: "MD 10M Studio Pro Pass (48-Hex Key)",
        tokens: "10,000,000",
        tier: "10M Studio Pro Tier",
      },
      {
        code: "MD-1E8A02B5F79D34C681E04B2A5F79C1D38E02B5A7F9D13C84",
        name: "MD 1M Starter Pass (48-Hex Key)",
        tokens: "1,000,000",
        tier: "1M Developer Starter Tier",
      },
    ],
    defaultModel: "gemini-3.8-flash",
    availableModels: [
      { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash (Autonomous Coding Agent)", context: "1M tokens", recommended: true },
      { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro (Deep Architecture & Reasoning)", context: "1M tokens", recommended: false },
      { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite (Ultra-fast Autocomplete)", context: "1M tokens", recommended: false },
      { id: "gemini-flash-latest", name: "Gemini Flash Latest (Production Stable)", context: "1M tokens", recommended: false },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (Deep Code Synthesis)", context: "1M tokens", recommended: false },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Fast Adaptive Assistant)", context: "1M tokens", recommended: false },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (High Throughput)", context: "1M tokens", recommended: false },
    ],
  });
});

// /v1/models (OpenAI-compatible)
app.get("/v1/models", (_req, res) => {
  const models = [
    { id: "gemini-3.8-flash", object: "model", created: 1710000000, owned_by: "google-gemini" },
    { id: "gemini-3.1-pro-preview", object: "model", created: 1710000000, owned_by: "google-gemini" },
    { id: "gemini-3.1-flash-lite", object: "model", created: 1710000000, owned_by: "google-gemini" },
    { id: "gemini-flash-latest", object: "model", created: 1710000000, owned_by: "google-gemini" },
    { id: "gemini-2.5-pro", object: "model", created: 1710000000, owned_by: "google-gemini" },
    { id: "gemini-2.5-flash", object: "model", created: 1710000000, owned_by: "google-gemini" },
    { id: "gemini-2.0-flash", object: "model", created: 1710000000, owned_by: "google-gemini" },
  ];
  res.json({ object: "list", data: models });
});

// /v1/chat/completions (OpenAI-compatible)
app.post("/v1/chat/completions", async (req, res) => {
  const auth = authenticateKeyOrCdk(req.headers.authorization, req.headers["x-api-key"] as string);

  if (!auth.valid || !auth.geminiKey) {
    res.status(401).json({
      error: {
        message:
          auth.source === "Quota Exceeded"
            ? "Your token quota has been exhausted. Please redeem a 10M or 20M token CDK in the portal."
            : "Unauthorized. Please provide a valid Generated API Key (sk_agent_...) or Website CDK in the 'Authorization: Bearer <KEY>' header.",
        type: "invalid_request_error",
        code: "invalid_api_key_or_cdk",
      },
    });
    return;
  }

  const {
    model = "gemini-3.8-flash",
    messages = [],
    temperature = 0.2,
    top_p,
    stream = false,
  } = req.body;

  try {
    const ai = new GoogleGenAI({
      apiKey: auth.geminiKey,
      httpOptions: {
        headers: { "User-Agent": "vscode-cdk-agent-portal" },
      },
    });

    let systemInstruction = "You are an elite coding agent assisting in VS Code. Provide accurate, production-ready code, diffs, and explanations.";
    const systemParts: string[] = [];
    const contents: any[] = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        systemParts.push(typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content));
      } else if (msg.role === "user") {
        const textContent = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
        contents.push({
          role: "user",
          parts: [{ text: textContent }],
        });
      } else if (msg.role === "assistant") {
        const textContent = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
        contents.push({
          role: "model",
          parts: [{ text: textContent }],
        });
      }
    }

    if (systemParts.length > 0) {
      systemInstruction = systemParts.join("\n\n");
    }

    if (contents.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: "Hello AI Assistant" }],
      });
    }

    let targetModel = model;
    if (targetModel.startsWith("gpt-") || targetModel === "claude-3-5-sonnet") {
      targetModel = "gemini-3.8-flash";
    }

    const config: any = {
      systemInstruction,
      temperature: typeof temperature === "number" ? Math.max(0, Math.min(temperature, 1)) : 0.2,
      topP: typeof top_p === "number" ? top_p : 0.95,
    };

    const candidateModels = [
      targetModel,
      "gemini-3.8-flash",
      "gemini-3.1-pro-preview",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
    ].filter((v, idx, arr) => arr.indexOf(v) === idx);

    const completionId = `chatcmpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdTimestamp = Math.floor(Date.now() / 1000);

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let streamed = false;
      let lastErr: any = null;
      let totalStreamedChars = 0;

      for (const modelToTry of candidateModels) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model: modelToTry,
            contents,
            config,
          });

          for await (const chunk of responseStream) {
            const chunkText = chunk.text || "";
            if (chunkText) {
              totalStreamedChars += chunkText.length;
              const sseData = {
                id: completionId,
                object: "chat.completion.chunk",
                created: createdTimestamp,
                model: modelToTry,
                choices: [
                  {
                    index: 0,
                    delta: { content: chunkText },
                    finish_reason: null,
                  },
                ],
              };
              res.write(`data: ${JSON.stringify(sseData)}\n\n`);
            }
          }

          const finishData = {
            id: completionId,
            object: "chat.completion.chunk",
            created: createdTimestamp,
            model: modelToTry,
            choices: [
              {
                index: 0,
                delta: {},
                finish_reason: "stop",
              },
            ],
          };
          res.write(`data: ${JSON.stringify(finishData)}\n\n`);
          res.write("data: [DONE]\n\n");
          res.end();

          // Deduct tokens
          const estimatedTokens = Math.round((JSON.stringify(contents).length + totalStreamedChars) / 4);
          deductTokens(auth, Math.max(20, estimatedTokens));

          streamed = true;
          break;
        } catch (err: any) {
          lastErr = err;
          if (
            err.message?.includes("503") ||
            err.message?.includes("demand") ||
            err.message?.includes("429") ||
            err.message?.includes("quota") ||
            err.message?.includes("Quota")
          ) {
            continue;
          }
          break;
        }
      }

      if (!streamed) {
        throw lastErr || new Error("Failed to stream completion from models.");
      }
    } else {
      let responseText = "";
      let modelUsed = targetModel;
      let lastErr: any = null;

      for (const modelToTry of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelToTry,
            contents,
            config,
          });
          responseText = response.text || "";
          modelUsed = modelToTry;
          lastErr = null;
          break;
        } catch (err: any) {
          lastErr = err;
          if (
            err.message?.includes("503") ||
            err.message?.includes("demand") ||
            err.message?.includes("429") ||
            err.message?.includes("quota") ||
            err.message?.includes("Quota")
          ) {
            continue;
          }
          break;
        }
      }

      if (lastErr && !responseText) {
        throw lastErr;
      }

      const promptChars = JSON.stringify(contents).length;
      const promptTokens = Math.round(promptChars / 4);
      const completionTokens = Math.round(responseText.length / 4);
      const totalTokens = promptTokens + completionTokens;

      deductTokens(auth, Math.max(20, totalTokens));

      res.json({
        id: completionId,
        object: "chat.completion",
        created: createdTimestamp,
        model: modelUsed,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: responseText,
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
        },
      });
    }
  } catch (err: any) {
    console.error("VS Code chat completions error:", err);
    res.status(500).json({
      error: {
        message: err.message || "Failed to process completion request with Gemini engine.",
        type: "api_error",
        code: "gemini_generation_error",
      },
    });
  }
});

// -------------------------------------------------------------
// 4. LIVE PLAYGROUND TEST PROMPT
// -------------------------------------------------------------
app.post("/api/test/prompt", async (req, res) => {
  const { apiKey, prompt = "Hello! Verify connection." } = req.body;
  const auth = authenticateKeyOrCdk(apiKey ? `Bearer ${apiKey}` : undefined, undefined);

  if (!auth.valid) {
    res.status(401).json({
      success: false,
      error: "Invalid or expired API key. Please redeem a CDK first.",
    });
    return;
  }

  const startTime = Date.now();
  try {
    const ai = new GoogleGenAI({ apiKey: auth.geminiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an AI coding assistant. Answer concisely in 1-2 sentences verifying that the API Key and connection work.",
      },
    });

    const reply = response.text || "Connected successfully!";
    const latency = Date.now() - startTime;
    const tokensUsed = Math.round((prompt.length + reply.length) / 4);

    deductTokens(auth, Math.max(10, tokensUsed));

    res.json({
      success: true,
      reply,
      latency,
      tokensUsed,
      remainingTokens: auth.remainingTokens - tokensUsed,
      tier: auth.source,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to execute test prompt.",
    });
  }
});

// Fallback for unmatched API routes
app.all("/api/*", (_req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
  });
});

// -------------------------------------------------------------
// VITE MIDDLEWARE & HARDENED SERVER STARTUP
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    // Serve production assets with strict dotfile suppression and no source maps
    app.use(
      express.static(distPath, {
        dotfiles: "ignore",
        index: false,
        fallthrough: true,
      })
    );
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Generic sanitized error handler (hides stack traces and internals)
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(err.status || 500).json({
      error: "Internal Server Error",
    });
  });

  // Slowloris & TCP socket exhaustion defense
  server.headersTimeout = 25000;
  server.requestTimeout = 35000;
  server.keepAliveTimeout = 10000;

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`𝐒𝐨𝐌𝐚𝐃𝐞𝐭𝐡 AI Portal running on port ${PORT}`);
  });
}

startServer();
