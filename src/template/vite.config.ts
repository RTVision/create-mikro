import { VitePluginNode } from 'vite-plugin-node';
import { loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dirName = dirname(fileURLToPath(import.meta.url));

export default function ({ mode }: { mode: string }) {
	const config = {
		resolve: {
			alias: {
				'@': join(dirName, 'src')
			}
		},
		build: {
			target: 'node18',
			assetsDir: 'lib',
			minify: false
		},
		publicDir: './src/assets/public/',
		server: {
			host: true,
			port: 8099
		},
		plugins: VitePluginNode({
			adapter: 'fastify',
			appPath: './src/App.ts',
			exportName: 'default'
		})
	};

	if (mode !== 'production') {
		process.env = {
			...process.env,
			...loadEnv(mode, __dirname, '')
		};
	}

	return config;
}
