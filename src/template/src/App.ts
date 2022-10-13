import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import type { FastifyPluginAsync } from 'fastify';
import { fastify } from 'fastify';

const app = fastify({
	logger: import.meta.env.DEV
}).withTypeProvider<JsonSchemaToTsProvider>();

const pluginImports = import.meta.glob<FastifyPluginAsync>(
	['@/routes/**/*.ts', '@/fastify/**/*.ts'],
	{
		eager: true,
		import: 'default'
	}
);
const registerPluginsPromise: Promise<unknown>[] = [];
for (const pluginPath in pluginImports) {
	const options: UnknownObject = {};
	if (pluginPath.includes('/routes/')) {
		options.prefix = pluginPath
			.split('/routes/')[1]
			.replace(/(?:\/?index)?\.ts/, '')
			.toLowerCase();
	}
	registerPluginsPromise.push(
		app.register(
			pluginImports[pluginPath],
			options
		) as unknown as Promise<unknown>
	);
}

await Promise.all(registerPluginsPromise);

if (import.meta.env.PROD) {
	await app.listen({ port: 8000, host: '::' });
}

export default app;
