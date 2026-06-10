const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');
const config = require('../config');
const AiUsage = require('../models/AiUsage');
const { AppError } = require('../utils/errors');

const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000;
const ORG_RATE_LIMIT = 100;
const RATE_WINDOW = 60 * 60 * 1000;

const getCacheKey = (type, data) => {
  const hash = crypto.createHash('md5').update(JSON.stringify({ type, data })).digest('hex');
  return `ai:${hash}`;
};

const getFromCache = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

const setCache = (key, value) => {
  cache.set(key, { value, timestamp: Date.now() });
};

class AiService {
  constructor() {
    if (config.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    }
  }

  getModel(genConfig = {}) {
    if (!this.genAI) return null;
    return this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: genConfig.temperature ?? 0.3,
        responseMimeType: genConfig.responseMimeType ?? 'application/json',
        ...genConfig,
      },
    });
  }

  async checkOrgRateLimit(userId) {
    if (!config.geminiApiKey) return;
    const user = await require('../models/User').findById(userId).select('organizationId');
    if (!user?.organizationId) return;

    const count = await AiUsage.countDocuments({
      organization: user.organizationId,
      createdAt: { $gte: new Date(Date.now() - RATE_WINDOW) },
    });

    if (count >= ORG_RATE_LIMIT) {
      throw new AppError('Organization AI usage limit reached. Please try again later or upgrade your plan.', 429);
    }
  }

  async generateContent(prompt, systemInstruction) {
    const model = this.getModel();
    if (!model) {
      throw new AppError('AI service is not configured. Contact administrator.', 500);
    }
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: { role: 'user', parts: [{ text: systemInstruction || 'You are a helpful AI assistant. Always respond with valid JSON.' }] },
    });
    const text = result.response.text();
    return JSON.parse(text);
  }

  async *generateContentStream(prompt, systemInstruction) {
    const model = this.getModel({ responseMimeType: undefined, temperature: 0.7 });
    if (!model) {
      throw new AppError('AI service is not configured. Contact administrator.', 500);
    }
    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: { role: 'user', parts: [{ text: systemInstruction || 'You are a helpful AI assistant.' }] },
    });
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }

  async recordUsage({ userId, projectId, type, input, output, model }) {
    try {
      const user = await require('../models/User').findById(userId).select('organizationId');
      await AiUsage.create({
        user: userId,
        organization: user?.organizationId,
        project: projectId,
        type,
        input: typeof input === 'string' ? { text: input.substring(0, 500) } : input,
        output: typeof output === 'string' ? { text: output.substring(0, 500) } : output,
        model: model || 'gemini-2.0-flash',
        responseTime: 0,
      });
    } catch (err) {
      console.error('Failed to record AI usage:', err.message);
    }
  }

  async chat(prompt, context, userId) {
    await this.checkOrgRateLimit(userId);

    const cacheKey = getCacheKey('chat', { prompt, context });
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    const fullPrompt = `Context:\n${context || 'No additional context'}\n\nUser question: ${prompt}\n\nProvide a helpful response. If asked about code, include relevant code snippets.`;
    const result = await this.generateContent(fullPrompt, 'You are an AI assistant for a bug tracking and project management platform. Help users understand their bugs, suggest fixes, and provide best practices.');

    setCache(cacheKey, result);
    await this.recordUsage({ userId, type: 'chat', input: prompt, output: result });
    return result;
  }

  async *chatStream(prompt, context, userId) {
    await this.checkOrgRateLimit(userId);

    const fullPrompt = `Context:\n${context || 'No additional context'}\n\nUser question: ${prompt}\n\nProvide a helpful response. If asked about code, include relevant code snippets.`;
    yield* this.generateContentStream(fullPrompt, 'You are an AI assistant for a bug tracking and project management platform. Help users understand their bugs, suggest fixes, and provide best practices.');

    await this.recordUsage({ userId, type: 'chat_stream', input: prompt, output: '' }).catch(() => {});
  }

  async explainBug(bugData, userId) {
    await this.checkOrgRateLimit(userId);

    const cacheKey = getCacheKey('explain', bugData);
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const prompt = `You are an expert bug analysis AI. Analyze this bug and provide a detailed explanation.

Bug Title: ${bugData.title}
Description: ${bugData.description || 'N/A'}
Error Message: ${bugData.errorMessage || 'N/A'}
Stack Trace: ${bugData.stackTrace || 'N/A'}
Steps to Reproduce: ${bugData.stepsToReproduce || 'N/A'}
Expected Behavior: ${bugData.expectedBehavior || 'N/A'}
Actual Behavior: ${bugData.actualBehavior || 'N/A'}
Severity: ${bugData.severity || 'N/A'}

Provide a JSON response with:
1. rootCause: The root cause of the bug
2. impact: The impact of this bug
3. explanation: A clear explanation of the bug
4. recommendedActions: Array of recommended actions to fix it`;

      const result = await this.generateContent(prompt, 'You are an expert bug analysis assistant. Always respond with valid JSON.');
      setCache(cacheKey, result);
      await this.recordUsage({ userId, projectId: bugData.projectId, type: 'explain', input: { title: bugData.title, description: bugData.description }, output: result });
      return result;
    } catch (error) {
      this._handleAIError(error);
    }
  }

  async suggestFix(bugData, userId) {
    await this.checkOrgRateLimit(userId);

    const cacheKey = getCacheKey('suggest_fix', bugData);
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const prompt = `You are an expert bug fixing AI. Suggest fixes for this bug.

Bug Title: ${bugData.title}
Description: ${bugData.description || 'N/A'}
Root Cause: ${bugData.rootCause || 'N/A'}
Severity: ${bugData.severity || 'N/A'}

Provide a JSON response with:
1. possibleFixes: Array of { description, codeSnippet, filePath }
2. preventionTips: Array of prevention tips`;

      const result = await this.generateContent(prompt, 'You are an expert bug fixing assistant. Always respond with valid JSON.');
      setCache(cacheKey, result);
      await this.recordUsage({ userId, projectId: bugData.projectId, type: 'suggest_fix', input: { title: bugData.title, description: bugData.description }, output: result });
      return result;
    } catch (error) {
      this._handleAIError(error);
    }
  }

  async generateReleaseNotes(sprintData, userId) {
    await this.checkOrgRateLimit(userId);

    const cacheKey = getCacheKey('release_notes', sprintData);
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const prompt = `Generate professional release notes from this sprint data.

Sprint Name: ${sprintData.name}
Completed Bugs: ${JSON.stringify(sprintData.completedBugs || [])}
Completed Tasks: ${JSON.stringify(sprintData.completedTasks || [])}

Provide a JSON response with:
1. version: Suggested version number
2. title: Release title
3. date: Release date
4. summary: Brief summary
5. newFeatures: Array of strings
6. bugFixes: Array of strings
7. improvements: Array of strings
8. notes: Additional notes`;

      const result = await this.generateContent(prompt, 'You are a release notes generator. Always respond with valid JSON.');
      setCache(cacheKey, result);
      await this.recordUsage({ userId, type: 'release_notes', input: { sprintName: sprintData.name }, output: result });
      return result;
    } catch (error) {
      this._handleAIError(error);
    }
  }

  async detectPriority(bugData, userId) {
    await this.checkOrgRateLimit(userId);

    const cacheKey = getCacheKey('auto_priority', bugData);
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const prompt = `Analyze this bug and determine its priority level.

Title: ${bugData.title}
Description: ${bugData.description || 'N/A'}
Severity: ${bugData.severity || 'N/A'}

Respond with JSON:
{
  "priority": "low" | "medium" | "high" | "critical",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;

      const result = await this.generateContent(prompt, 'You are a bug priority classifier. Always respond with valid JSON.');
      setCache(cacheKey, result);
      await this.recordUsage({ userId, projectId: bugData.projectId, type: 'auto_priority', input: { title: bugData.title, description: bugData.description }, output: result });
      return result;
    } catch (error) {
      this._handleAIError(error);
    }
  }

  async generateSummary(projectData, userId) {
    await this.checkOrgRateLimit(userId);

    const cacheKey = getCacheKey('summary', projectData);
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const prompt = `Generate a project summary based on this data.

Project: ${projectData.name}
Total Bugs: ${projectData.totalBugs}
Open Bugs: ${projectData.openBugs}
Resolved Bugs: ${projectData.resolvedBugs}
Active Sprint: ${projectData.activeSprint || 'N/A'}
Team Size: ${projectData.teamSize}

Provide a JSON response with:
1. status: Overall project health (healthy, warning, critical)
2. summary: Brief summary
3. highlights: Array of key highlights
4. recommendations: Array of recommendations`;

      const result = await this.generateContent(prompt, 'You are a project analysis AI. Always respond with valid JSON.');
      setCache(cacheKey, result);
      await this.recordUsage({ userId, type: 'summary', input: { projectName: projectData.name }, output: result });
      return result;
    } catch (error) {
      this._handleAIError(error);
    }
  }

  _handleAIError(error) {
    console.error('AI Service Error:', error.message);
    if (error.status === 403 || error.message?.includes('API key')) {
      throw new AppError('AI service is not configured or quota exceeded. Contact administrator.', 500);
    }
    if (error.message?.includes('rate') || error.message?.includes('quota')) {
      throw new AppError('AI rate limit exceeded. Please try again later.', 429);
    }
    if (error instanceof AppError) throw error;
    throw new AppError('AI processing failed. Please try again.', 500);
  }

  getCacheStats() {
    return { size: cache.size, keys: Array.from(cache.keys()) };
  }

  clearCache() {
    cache.clear();
  }
}

module.exports = new AiService();