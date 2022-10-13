import cliConfig from '@/MikroOrm.config.js';
import type { Options } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import copy from 'fast-copy';

const baseConfig: Options<PostgreSqlDriver> = {
	...cliConfig,
	entitiesTs: ['./src/models/**/*.ts'],
	dynamicImportProvider: async (id) => import(/* @vite-ignore */ id),
	metadataProvider: TsMorphMetadataProvider,
	tsNode: import.meta.env.DEV,
	debug: import.meta.env.DEV,
	discovery: {
		alwaysAnalyseProperties: false
	}
};

function buildConfig(kind: 'adm' | 'ro' | 'rw'): Options<PostgreSqlDriver> {
	const config = copy(baseConfig);
	config.debug = true;

	switch (kind) {
		case 'rw':
			config.user = process.env.DB_RW_USER;
			config.password = process.env.DB_RW_PASS;
			break;
		case 'ro':
			config.user = process.env.DB_RO_USER;
			config.password = process.env.DB_RO_PASS;
			break;
		case 'adm':
			// default config has admin user and PW in it so no need to set.
			break;
		default:
			throw new Error(`DB.connect(${kind}) not handled`);
	}
	return config;
}

const connection = new Map<string, MikroORM<PostgreSqlDriver>>();
export async function connect(
	type: 'adm' | 'ro' | 'rw'
): Promise<MikroORM<PostgreSqlDriver>> {
	let desiredConnection = connection.get(type);
	if (typeof desiredConnection === 'undefined') {
		const config = buildConfig(type);
		desiredConnection = await MikroORM.init(config);
		connection.set(type, desiredConnection);
	}
	return desiredConnection;
}
