import { connect } from '@/Database.js';
import type { Fastify } from '@/types/Fastify.js';
import type { PgEntityManager } from '@/types/index.js';
import fp from 'fastify-plugin';

async function fastifyMikroOrm(fastify: Fastify): Promise<void> {
	const connection = await connect('adm');

	fastify.decorate('db', connection.em);

	fastify.addHook(
		'onRequest',
		async function (this: typeof fastify, request, _reply) {
			request.db = connection.em.fork();
		}
	);

	fastify.addHook('onSend', async (request) => request.db.flush());
	fastify.addHook('onClose', async () => connection.close());
}

export default fp.default(fastifyMikroOrm, {
	name: 'fastify-mikro-orm'
});

declare module 'fastify' {
	interface FastifyRequest {
		db: PgEntityManager;
	}
}
