/**
 * Tests for tokenUsage.ts utility module
 *
 * Comprehensive test suite covering JSONL parsing, token aggregation,
 * and cost calculation for Claude Code session files.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readdir, readFile } from 'fs/promises';
import {
	buildSessionAgentMap,
	parseSessionUsage,
	getAgentUsage,
	getAllAgentUsage,
	calculateCost,
	getAllSessionIds,
	getSystemTotalUsage,
	type TokenUsage
} from './tokenUsage';

// Mock fs/promises
vi.mock('fs/promises', () => ({
	readdir: vi.fn(),
	readFile: vi.fn()
}));

// Mock os module for homedir
vi.mock('os', () => ({
	default: {
		homedir: () => '/mock/home'
	},
	homedir: () => '/mock/home'
}));

// =============================================================================
// Test Fixtures
// =============================================================================

const MOCK_AGENT_FILES = {
	'agent-session-1.txt': 'AgentAlpha',
	'agent-session-2.txt': 'AgentBeta',
	'agent-session-3.txt': 'AgentGamma',
	'agent-empty.txt': '', // Empty file
	'other-file.txt': 'NotAnAgent' // Non-agent file
};

const MOCK_JSONL_VALID = `
{"type":"request","message":{"usage":{"input_tokens":100,"cache_creation_input_tokens":50,"cache_read_input_tokens":25,"output_tokens":200}},"timestamp":"2025-11-21T10:00:00Z"}
{"type":"response","message":{"usage":{"input_tokens":150,"cache_creation_input_tokens":0,"cache_read_input_tokens":75,"output_tokens":250}},"timestamp":"2025-11-21T11:00:00Z"}
{"type":"request","message":{"usage":{"input_tokens":200,"cache_creation_input_tokens":100,"cache_read_input_tokens":50,"output_tokens":300}},"timestamp":"2025-11-21T12:00:00Z"}
`.trim();

const MOCK_JSONL_MALFORMED = `
{"type":"request","message":{"usage":{"input_tokens":100}},"timestamp":"2025-11-21T10:00:00Z"}
{this is not valid json}
{"type":"response","message":{"usage":{"input_tokens":200}},"timestamp":"2025-11-21T11:00:00Z"}
`.trim();

const MOCK_JSONL_MISSING_USAGE = `
{"type":"request","message":{},"timestamp":"2025-11-21T10:00:00Z"}
{"type":"response","timestamp":"2025-11-21T11:00:00Z"}
`.trim();

const MOCK_JSONL_EMPTY = '';

// =============================================================================
// Helper Functions
// =============================================================================

function createMockTokenUsage(overrides: Partial<TokenUsage> = {}): TokenUsage {
	return {
		input_tokens: 0,
		cache_creation_input_tokens: 0,
		cache_read_input_tokens: 0,
		output_tokens: 0,
		total_tokens: 0,
		cost: 0,
		sessionCount: 0,
		...overrides
	};
}

// =============================================================================
// Test Suite: buildSessionAgentMap()
// =============================================================================

describe('buildSessionAgentMap', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should build map from valid agent session files', async () => {
		const mockFiles = Object.keys(MOCK_AGENT_FILES);
		vi.mocked(readdir).mockResolvedValue(mockFiles as any);

		// Mock readFile for each agent file
		vi.mocked(readFile).mockImplementation((path: any) => {
			const filename = path.split('/').pop();
			return Promise.resolve(MOCK_AGENT_FILES[filename as keyof typeof MOCK_AGENT_FILES] || '');
		});

		const map = await buildSessionAgentMap('/test/project');

		expect(map.size).toBe(3); // Only agent-*.txt files with content
		expect(map.get('session-1')).toBe('AgentAlpha');
		expect(map.get('session-2')).toBe('AgentBeta');
		expect(map.get('session-3')).toBe('AgentGamma');
		expect(map.has('empty')).toBe(false); // Empty content ignored
	});

	it('should handle missing .claude directory', async () => {
		vi.mocked(readdir).mockRejectedValue(new Error('ENOENT: no such file or directory'));

		const map = await buildSessionAgentMap('/test/project');

		expect(map.size).toBe(0);
	});

	it('should filter out non-agent files', async () => {
		vi.mocked(readdir).mockResolvedValue(['agent-abc.txt', 'other-file.txt', 'readme.md'] as any);
		vi.mocked(readFile).mockResolvedValue('TestAgent');

		const map = await buildSessionAgentMap('/test/project');

		expect(map.size).toBe(1);
		expect(map.has('abc')).toBe(true);
	});

	it('should skip files that cannot be read', async () => {
		vi.mocked(readdir).mockResolvedValue(['agent-good.txt', 'agent-bad.txt'] as any);
		vi.mocked(readFile).mockImplementation((path: any) => {
			if (path.includes('bad')) {
				return Promise.reject(new Error('Permission denied'));
			}
			return Promise.resolve('GoodAgent');
		});

		const map = await buildSessionAgentMap('/test/project');

		expect(map.size).toBe(1);
		expect(map.get('good')).toBe('GoodAgent');
	});

	it('should trim whitespace from agent names', async () => {
		vi.mocked(readdir).mockResolvedValue(['agent-test.txt'] as any);
		vi.mocked(readFile).mockResolvedValue('  AgentWithSpaces  \n');

		const map = await buildSessionAgentMap('/test/project');

		expect(map.get('test')).toBe('AgentWithSpaces');
	});
});

// =============================================================================
// Test Suite: parseSessionUsage()
// =============================================================================

describe('parseSessionUsage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should parse valid JSONL with token data', async () => {
		vi.mocked(readFile).mockResolvedValue(MOCK_JSONL_VALID);

		const result = await parseSessionUsage('test-session', '/test/project');

		expect(result).not.toBeNull();
		expect(result!.sessionId).toBe('test-session');
		expect(result!.tokens.input).toBe(450); // 100 + 150 + 200
		expect(result!.tokens.cache_creation).toBe(150); // 50 + 0 + 100
		expect(result!.tokens.cache_read).toBe(150); // 25 + 75 + 50
		expect(result!.tokens.output).toBe(750); // 200 + 250 + 300
		expect(result!.tokens.total).toBe(1500);
		expect(result!.cost).toBeGreaterThan(0);
	});

	it('should handle malformed JSON lines gracefully', async () => {
		vi.mocked(readFile).mockResolvedValue(MOCK_JSONL_MALFORMED);

		const result = await parseSessionUsage('test-session', '/test/project');

		expect(result).not.toBeNull();
		expect(result!.tokens.input).toBe(300); // Only valid lines: 100 + 200
		expect(result!.tokens.output).toBe(0); // Missing output tokens
	});

	it('should handle missing usage fields', async () => {
		vi.mocked(readFile).mockResolvedValue(MOCK_JSONL_MISSING_USAGE);

		const result = await parseSessionUsage('test-session', '/test/project');

		expect(result).not.toBeNull();
		expect(result!.tokens.total).toBe(0);
		expect(result!.cost).toBe(0);
	});

	it('should handle empty JSONL files', async () => {
		vi.mocked(readFile).mockResolvedValue(MOCK_JSONL_EMPTY);

		const result = await parseSessionUsage('test-session', '/test/project');

		expect(result).not.toBeNull();
		expect(result!.tokens.total).toBe(0);
	});

	it('should return null for missing JSONL file', async () => {
		vi.mocked(readFile).mockRejectedValue(new Error('ENOENT: file not found'));

		const result = await parseSessionUsage('nonexistent', '/test/project');

		expect(result).toBeNull();
	});

	it('should extract most recent timestamp', async () => {
		vi.mocked(readFile).mockResolvedValue(MOCK_JSONL_VALID);

		const result = await parseSessionUsage('test-session', '/test/project');

		expect(result!.timestamp).toBe('2025-11-21T12:00:00Z'); // Last timestamp
	});

	it('should handle project path with slashes correctly', async () => {
		vi.mocked(readFile).mockResolvedValue(MOCK_JSONL_VALID);

		await parseSessionUsage('test', '/home/user/code/project');

		expect(vi.mocked(readFile)).toHaveBeenCalledWith(
			expect.stringContaining('-home-user-code-project')
		);
	});
});

// =============================================================================
// Test Suite: calculateCost()
// =============================================================================

describe('calculateCost', () => {
	it('should calculate cost with Claude Sonnet 4.5 pricing', () => {
		const usage = createMockTokenUsage({
			input_tokens: 1_000_000, // 1M tokens
			cache_creation_input_tokens: 1_000_000,
			cache_read_input_tokens: 1_000_000,
			output_tokens: 1_000_000
		});

		const cost = calculateCost(usage);

		// Input: $3.00, Cache creation: $3.75, Cache read: $0.30, Output: $15.00
		expect(cost).toBeCloseTo(22.05, 2); // 3 + 3.75 + 0.3 + 15 = 22.05
	});

	it('should handle zero tokens', () => {
		const usage = createMockTokenUsage();

		const cost = calculateCost(usage);

		expect(cost).toBe(0);
	});

	it('should calculate cost for small token counts', () => {
		const usage = createMockTokenUsage({
			input_tokens: 100,
			output_tokens: 200
		});

		const cost = calculateCost(usage);

		// (100 / 1M * 3) + (200 / 1M * 15) = 0.0003 + 0.003 = 0.0033
		expect(cost).toBeCloseTo(0.0033, 4);
	});

	it('should handle very large token counts', () => {
		const usage = createMockTokenUsage({
			input_tokens: 100_000_000, // 100M tokens
			output_tokens: 50_000_000
		});

		const cost = calculateCost(usage);

		// (100M / 1M * 3) + (50M / 1M * 15) = 300 + 750 = 1050
		expect(cost).toBe(1050);
	});

	it('should handle only cache tokens', () => {
		const usage = createMockTokenUsage({
			cache_creation_input_tokens: 1_000_000,
			cache_read_input_tokens: 1_000_000
		});

		const cost = calculateCost(usage);

		// 3.75 + 0.3 = 4.05
		expect(cost).toBeCloseTo(4.05, 2);
	});
});

// =============================================================================
// Test Suite: getAgentUsage()
// =============================================================================

describe('getAgentUsage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should aggregate usage for single agent with single session', async () => {
		vi.mocked(readdir).mockResolvedValue(['agent-session-1.txt'] as any);
		vi.mocked(readFile).mockImplementation((path: any) => {
			if (path.includes('.claude/agent-')) {
				return Promise.resolve('TestAgent');
			}
			return Promise.resolve(MOCK_JSONL_VALID);
		});

		const usage = await getAgentUsage('TestAgent', 'all', '/test/project');

		expect(usage.sessionCount).toBe(1);
		expect(usage.total_tokens).toBe(1500);
		expect(usage.cost).toBeGreaterThan(0);
	});

	it('should aggregate usage for agent with multiple sessions', async () => {
		vi.mocked(readdir).mockResolvedValue(['agent-s1.txt', 'agent-s2.txt'] as any);
		vi.mocked(readFile).mockImplementation((path: any) => {
			if (path.includes('.claude/agent-')) {
				return Promise.resolve('MultiAgent');
			}
			return Promise.resolve(MOCK_JSONL_VALID);
		});

		const usage = await getAgentUsage('MultiAgent', 'all', '/test/project');

		expect(usage.sessionCount).toBe(2);
		expect(usage.total_tokens).toBe(3000); // 1500 * 2 sessions
	});

	it('should return zero usage for agent with no sessions', async () => {
		vi.mocked(readdir).mockResolvedValue([] as any);

		const usage = await getAgentUsage('NoSessions', 'all', '/test/project');

		expect(usage.sessionCount).toBe(0);
		expect(usage.total_tokens).toBe(0);
		expect(usage.cost).toBe(0);
	});

	it('should filter by time range (today)', async () => {
		const today = new Date().toISOString().split('T')[0];
		const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

		const jsonlToday = `{"type":"request","message":{"usage":{"input_tokens":100}},"timestamp":"${today}T10:00:00Z"}`;
		const jsonlYesterday = `{"type":"request","message":{"usage":{"input_tokens":200}},"timestamp":"${yesterday}"}`;

		vi.mocked(readdir).mockResolvedValue(['agent-today.txt', 'agent-yesterday.txt'] as any);
		vi.mocked(readFile).mockImplementation((path: any) => {
			if (path.includes('.claude/agent-')) {
				return Promise.resolve('TimeAgent');
			}
			if (path.includes('today.jsonl')) {
				return Promise.resolve(jsonlToday);
			}
			return Promise.resolve(jsonlYesterday);
		});

		const usage = await getAgentUsage('TimeAgent', 'today', '/test/project');

		expect(usage.sessionCount).toBe(1); // Only today's session
		expect(usage.input_tokens).toBe(100); // Only today's tokens
	});

	it('should handle agent with failed session parses', async () => {
		vi.mocked(readdir).mockResolvedValue(['agent-good.txt', 'agent-bad.txt'] as any);
		vi.mocked(readFile).mockImplementation((path: any) => {
			if (path.includes('.claude/agent-')) {
				return Promise.resolve('MixedAgent');
			}
			if (path.includes('bad.jsonl')) {
				return Promise.reject(new Error('Parse error'));
			}
			return Promise.resolve(MOCK_JSONL_VALID);
		});

		const usage = await getAgentUsage('MixedAgent', 'all', '/test/project');

		expect(usage.sessionCount).toBe(1); // Only successful parse
		expect(usage.total_tokens).toBe(1500);
	});
});

// =============================================================================
// Test Suite: getAllAgentUsage()
// =============================================================================

describe('getAllAgentUsage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should aggregate usage for multiple agents', async () => {
		vi.mocked(readdir).mockResolvedValue([
			'agent-a1.txt',
			'agent-a2.txt',
			'agent-b1.txt'
		] as any);
		vi.mocked(readFile).mockImplementation((path: any) => {
			if (path.includes('agent-a')) {
				return Promise.resolve('AgentA');
			}
			if (path.includes('agent-b')) {
				return Promise.resolve('AgentB');
			}
			return Promise.resolve(MOCK_JSONL_VALID);
		});

		const usageMap = await getAllAgentUsage('all', '/test/project');

		expect(usageMap.size).toBe(2);
		expect(usageMap.has('AgentA')).toBe(true);
		expect(usageMap.has('AgentB')).toBe(true);
		expect(usageMap.get('AgentA')!.sessionCount).toBe(2);
		expect(usageMap.get('AgentB')!.sessionCount).toBe(1);
	});

	it('should return empty map when no agents exist', async () => {
		vi.mocked(readdir).mockResolvedValue([] as any);

		const usageMap = await getAllAgentUsage('all', '/test/project');

		expect(usageMap.size).toBe(0);
	});

	it('should handle time range filtering', async () => {
		vi.mocked(readdir).mockResolvedValue(['agent-test.txt'] as any);
		vi.mocked(readFile).mockImplementation((path: any) => {
			if (path.includes('.claude/agent-')) {
				return Promise.resolve('TestAgent');
			}
			return Promise.resolve(MOCK_JSONL_VALID);
		});

		const usageMap = await getAllAgentUsage('week', '/test/project');

		expect(usageMap.size).toBe(1);
	});
});

// =============================================================================
// Test Suite: getSystemTotalUsage()
// =============================================================================

describe('getSystemTotalUsage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should calculate system-wide total usage', async () => {
		vi.mocked(readdir).mockResolvedValue(['agent-1.txt', 'agent-2.txt'] as any);
		vi.mocked(readFile).mockImplementation((path: any) => {
			if (path.includes('agent-1')) {
				return Promise.resolve('Agent1');
			}
			if (path.includes('agent-2')) {
				return Promise.resolve('Agent2');
			}
			return Promise.resolve(MOCK_JSONL_VALID);
		});

		const totalUsage = await getSystemTotalUsage('all', '/test/project');

		expect(totalUsage.sessionCount).toBe(2);
		expect(totalUsage.total_tokens).toBe(3000); // 1500 * 2 agents
		expect(totalUsage.cost).toBeGreaterThan(0);
	});

	it('should return zero usage for empty system', async () => {
		vi.mocked(readdir).mockResolvedValue([] as any);

		const totalUsage = await getSystemTotalUsage('all', '/test/project');

		expect(totalUsage.sessionCount).toBe(0);
		expect(totalUsage.total_tokens).toBe(0);
		expect(totalUsage.cost).toBe(0);
	});
});

// =============================================================================
// Test Suite: getAllSessionIds()
// =============================================================================

describe('getAllSessionIds', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should list all JSONL session files', async () => {
		vi.mocked(readdir).mockResolvedValue([
			'session-1.jsonl',
			'session-2.jsonl',
			'not-a-session.txt'
		] as any);

		const sessionIds = await getAllSessionIds('/test/project');

		expect(sessionIds).toEqual(['session-1', 'session-2']);
	});

	it('should handle missing projects directory', async () => {
		vi.mocked(readdir).mockRejectedValue(new Error('ENOENT'));

		const sessionIds = await getAllSessionIds('/test/project');

		expect(sessionIds).toEqual([]);
	});
});
