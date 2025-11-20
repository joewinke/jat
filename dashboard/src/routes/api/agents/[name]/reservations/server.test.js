/**
 * Tests for agent reservations API endpoint
 * Prevents regression of global agent reservation query bugs (jat-n3a)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { GET, DELETE } from './+server.js';
import Database from 'better-sqlite3';
import { join } from 'path';
import { homedir } from 'os';
import { getReservations } from '$lib/server/agent-mail.js';

const TEST_DB_PATH = join(homedir(), '.agent-mail.db');

describe('Agent Reservations API', () => {
	let db;
	let testProjectId1, testProjectId2;
	let testAgentId1, testAgentId2;
	let testReservation1, testReservation2, testReservation3;

	beforeAll(() => {
		// Open the actual Agent Mail database
		db = new Database(TEST_DB_PATH);

		// Clean up any existing test data
		db.prepare('DELETE FROM file_reservations WHERE path_pattern LIKE ?').run('test/pattern/%');
		db.prepare('DELETE FROM agents WHERE name LIKE ?').run('TestAgent%');
		db.prepare('DELETE FROM projects WHERE human_key LIKE ?').run('test-project%');
	});

	beforeEach(() => {
		// Set up test data for multi-project scenario

		// Create test projects
		const project1Result = db.prepare(`
			INSERT INTO projects (slug, human_key, created_at)
			VALUES (?, ?, datetime('now'))
		`).run('test-project-alpha', 'test-project-alpha');
		testProjectId1 = project1Result.lastInsertRowid;

		const project2Result = db.prepare(`
			INSERT INTO projects (slug, human_key, created_at)
			VALUES (?, ?, datetime('now'))
		`).run('test-project-beta', 'test-project-beta');
		testProjectId2 = project2Result.lastInsertRowid;

		// Create test agents (globally unique names)
		const agent1Result = db.prepare(`
			INSERT INTO agents (name, program, model, project_id, inception_ts, last_active_ts)
			VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
		`).run('TestAgent1', 'claude-code', 'sonnet-4.5', testProjectId1);
		testAgentId1 = agent1Result.lastInsertRowid;

		const agent2Result = db.prepare(`
			INSERT INTO agents (name, program, model, project_id, inception_ts, last_active_ts)
			VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
		`).run('TestAgent2', 'claude-code', 'sonnet-4.5', testProjectId2);
		testAgentId2 = agent2Result.lastInsertRowid;

		// Create file reservations across different projects for same agent
		const res1 = db.prepare(`
			INSERT INTO file_reservations (
				agent_id, project_id, path_pattern, exclusive, reason,
				created_ts, expires_ts
			) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now', '+2 hours'))
		`).run(testAgentId1, testProjectId1, 'test/pattern/alpha/**', 1, 'test-task-1');
		testReservation1 = res1.lastInsertRowid;

		const res2 = db.prepare(`
			INSERT INTO file_reservations (
				agent_id, project_id, path_pattern, exclusive, reason,
				created_ts, expires_ts
			) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now', '+2 hours'))
		`).run(testAgentId1, testProjectId2, 'test/pattern/beta/**', 1, 'test-task-2');
		testReservation2 = res2.lastInsertRowid;

		// Create reservation for different agent in first project
		const res3 = db.prepare(`
			INSERT INTO file_reservations (
				agent_id, project_id, path_pattern, exclusive, reason,
				created_ts, expires_ts
			) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now', '+2 hours'))
		`).run(testAgentId2, testProjectId1, 'test/pattern/other/**', 1, 'test-task-3');
		testReservation3 = res3.lastInsertRowid;
	});

	afterEach(() => {
		// Clean up test data
		db.prepare('DELETE FROM file_reservations WHERE id IN (?, ?, ?)').run(
			testReservation1,
			testReservation2,
			testReservation3
		);
		db.prepare('DELETE FROM agents WHERE id IN (?, ?)').run(testAgentId1, testAgentId2);
		db.prepare('DELETE FROM projects WHERE id IN (?, ?)').run(testProjectId1, testProjectId2);
	});

	afterAll(() => {
		// Final cleanup
		db.prepare('DELETE FROM file_reservations WHERE path_pattern LIKE ?').run('test/pattern/%');
		db.prepare('DELETE FROM agents WHERE name LIKE ?').run('TestAgent%');
		db.prepare('DELETE FROM projects WHERE human_key LIKE ?').run('test-project%');
		db.close();
	});

	describe('getReservations() JS function', () => {
		it('should return all reservations across projects when projectPath is null', () => {
			// Test case 1: Global query (projectPath = null)
			const reservations = getReservations('TestAgent1', null);

			// Should return reservations from BOTH projects
			expect(reservations).toHaveLength(2);
			expect(reservations.map(r => r.id)).toContain(testReservation1);
			expect(reservations.map(r => r.id)).toContain(testReservation2);

			// Verify they're from different projects
			const projects = reservations.map(r => r.project_path);
			expect(projects).toContain('test-project-alpha');
			expect(projects).toContain('test-project-beta');
		});

		it('should filter by project when projectPath is specified', () => {
			// Test case 2: Project-filtered query
			const reservationsAlpha = getReservations('TestAgent1', 'test-project-alpha');

			// Should only return reservation from alpha project
			expect(reservationsAlpha).toHaveLength(1);
			expect(reservationsAlpha[0].id).toBe(testReservation1);
			expect(reservationsAlpha[0].project_path).toBe('test-project-alpha');

			const reservationsBeta = getReservations('TestAgent1', 'test-project-beta');

			// Should only return reservation from beta project
			expect(reservationsBeta).toHaveLength(1);
			expect(reservationsBeta[0].id).toBe(testReservation2);
			expect(reservationsBeta[0].project_path).toBe('test-project-beta');
		});

		it('should return reservations for correct agent only', () => {
			// Verify agent filtering works correctly
			const agent1Reservations = getReservations('TestAgent1', null);
			const agent2Reservations = getReservations('TestAgent2', null);

			expect(agent1Reservations).toHaveLength(2);
			expect(agent2Reservations).toHaveLength(1);
			expect(agent2Reservations[0].id).toBe(testReservation3);
		});

		it('should handle multi-project agents correctly', () => {
			// Test the specific bug scenario from jat-n3a:
			// Agent with locks in different projects should see all locks when queried globally
			const allReservations = getReservations('TestAgent1', null);

			// Verify we get both reservations
			expect(allReservations).toHaveLength(2);

			// Verify they have different project paths
			const uniqueProjects = [...new Set(allReservations.map(r => r.project_path))];
			expect(uniqueProjects).toHaveLength(2);
			expect(uniqueProjects).toContain('test-project-alpha');
			expect(uniqueProjects).toContain('test-project-beta');
		});
	});

	describe('GET /api/agents/[name]/reservations endpoint', () => {
		it('should return global results for agent (projectPath = null)', async () => {
			// Test case 3: API endpoint returns global results
			const mockRequest = {
				params: { name: 'TestAgent1' }
			};

			const response = await GET(mockRequest);
			const data = await response.json();

			expect(data.success).toBe(true);
			expect(data.agentName).toBe('TestAgent1');
			expect(data.reservations).toHaveLength(2);
			expect(data.count).toBe(2);

			// Verify reservations are from both projects
			const projects = data.reservations.map(r => r.project_path);
			expect(projects).toContain('test-project-alpha');
			expect(projects).toContain('test-project-beta');
		});

		it('should return 400 if agent name is missing', async () => {
			const mockRequest = {
				params: {}
			};

			const response = await GET(mockRequest);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe('Missing agent name');
		});

		it('should handle non-existent agents gracefully', async () => {
			const mockRequest = {
				params: { name: 'NonExistentAgent' }
			};

			const response = await GET(mockRequest);
			const data = await response.json();

			expect(data.success).toBe(true);
			expect(data.reservations).toHaveLength(0);
			expect(data.count).toBe(0);
		});
	});

	describe('DELETE /api/agents/[name]/reservations endpoint', () => {
		it('should release a valid reservation', async () => {
			const mockRequest = {
				params: { name: 'TestAgent1' },
				url: new URL(`http://localhost/api/agents/TestAgent1/reservations?id=${testReservation1}`)
			};

			const response = await DELETE(mockRequest);
			const data = await response.json();

			expect(data.success).toBe(true);
			expect(data.reservationId).toBe(testReservation1);
			expect(data.pattern).toBe('test/pattern/alpha/**');

			// Verify reservation was actually released
			const reservation = db.prepare('SELECT released_ts FROM file_reservations WHERE id = ?').get(testReservation1);
			expect(reservation.released_ts).not.toBeNull();
		});

		it('should return 404 for non-existent reservation', async () => {
			const mockRequest = {
				params: { name: 'TestAgent1' },
				url: new URL('http://localhost/api/agents/TestAgent1/reservations?id=999999')
			};

			const response = await DELETE(mockRequest);
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data.error).toBe('Reservation not found');
		});

		it('should return 403 when trying to release another agents reservation', async () => {
			const mockRequest = {
				params: { name: 'TestAgent1' },
				url: new URL(`http://localhost/api/agents/TestAgent1/reservations?id=${testReservation3}`)
			};

			const response = await DELETE(mockRequest);
			const data = await response.json();

			expect(response.status).toBe(403);
			expect(data.error).toBe('Permission denied');
		});

		it('should return 400 if reservation ID is missing', async () => {
			const mockRequest = {
				params: { name: 'TestAgent1' },
				url: new URL('http://localhost/api/agents/TestAgent1/reservations')
			};

			const response = await DELETE(mockRequest);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe('Missing reservation ID');
		});
	});

	describe('Regression prevention for jat-n3a', () => {
		it('should prevent file locks modal showing no locks for global agents', () => {
			// This test specifically prevents regression of the jat-n3a bug:
			// Modal was calling am-reservations bash command which filtered by project,
			// causing global agents to show no locks

			// Simulate the bug scenario:
			// 1. Agent has locks in multiple projects
			// 2. API endpoint must return ALL locks (not filtered by project)

			const reservations = getReservations('TestAgent1', null);

			// Critical assertion: MUST return locks from all projects
			expect(reservations.length).toBeGreaterThan(1);

			// Verify locks are from different projects
			const projectPaths = reservations.map(r => r.project_path);
			const uniqueProjects = [...new Set(projectPaths)];
			expect(uniqueProjects.length).toBeGreaterThan(1);

			// This ensures the fix (passing null for projectPath) is maintained
			expect(reservations.every(r => r.agent_name === 'TestAgent1')).toBe(true);
		});
	});
});
