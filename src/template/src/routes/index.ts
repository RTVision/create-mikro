import type { Fastify } from '@/types/Fastify.js';

export default async function router(app: Fastify): Promise<void> {
	app.route({
		url: '/',
		method: 'GET',
		handler: async (request, _reply) => {
			return 'hello world';
		}
	});
}
