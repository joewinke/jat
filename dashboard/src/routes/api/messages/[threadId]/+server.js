import { json } from '@sveltejs/kit';
import { getThreadMessages } from '$lib/server/agent-mail.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
	const { threadId } = params;

	try {
		const messages = getThreadMessages(threadId);
		return json({ messages });
	} catch (error) {
		console.error('Error fetching thread messages:', error);
		return json({ error: error.message, messages: [] }, { status: 500 });
	}
}
