/**
 * Server-side Agent Mail integration
 * Wraps lib/agent-mail.js for use in SvelteKit server routes
 */

import agentMail from '../../../../lib/agent-mail.js';

/**
 * Get all messages in a thread
 * @param {string} threadId - Thread identifier
 * @returns {Array} - Array of message objects
 */
export function getThreadMessages(threadId) {
	return agentMail.getThreadMessages(threadId);
}

/**
 * Get inbox messages for an agent in a specific thread
 * @param {string} agentName - Agent name
 * @param {string} threadId - Thread identifier
 * @returns {Array} - Array of message objects
 */
export function getInboxForThread(agentName, threadId) {
	return agentMail.getInboxForThread(agentName, threadId);
}

/**
 * Get all registered agents
 * @returns {Array} - Array of agent objects
 */
export function getAgents() {
	return agentMail.getAgents();
}

/**
 * Get all message threads
 * @returns {Array} - Array of thread objects
 */
export function getThreads() {
	return agentMail.getThreads();
}

/**
 * Search messages by query string
 * @param {string} query - Search query
 * @returns {Array} - Array of matching message objects
 */
export function searchMessages(query) {
	return agentMail.searchMessages(query);
}
