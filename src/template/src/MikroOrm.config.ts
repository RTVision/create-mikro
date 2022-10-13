import type { AnyEntity, EntityClass, Options } from '@mikro-orm/core';
import { LoadStrategy, UnderscoreNamingStrategy } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir, stat } from 'node:fs/promises';

export async function walkDirectories(
	path: string,
	blacklist: RegExp | null = null,
	depth = Infinity
): Promise<string[]> {
	const files: string[] = [];
	const directoryContents = await readdir(path);
	const promises: Promise<string[]>[] = [];
	for (const directoryContent of directoryContents) {
		const newPath = resolve(path, directoryContent);
		if (blacklist === null || !blacklist.test(newPath)) {
			const contentInfo = await stat(newPath);
			if (contentInfo.isDirectory() && depth !== 1) {
				promises.push(walkDirectories(newPath, blacklist, depth - 1));
			} else {
				files.push(newPath);
			}
		}
	}
	const subFiles = await Promise.all(promises);
	return files.concat(subFiles.flat());
}

const dirName = dirname(fileURLToPath(import.meta.url));

let entityMap: Record<string, EntityClass<AnyEntity>>;
if (typeof import.meta.env?.MODE === 'string') {
	entityMap = import.meta.glob<EntityClass<AnyEntity>>('./models/**/*.ts', {
		eager: true,
		import: 'default'
	});
} else {
	// This is ONLY used for the CLI case
	// in prod/dev vite uses the import.meta.glob which doesn't
	// have as much overhead as vite figures out the imports at compile time
	entityMap = {};
	const models = await walkDirectories(join(dirName, 'models'));
	const modelPromises = [];
	for (const model of models) {
		modelPromises.push(
			import(/* @vite-ignore */ model).then((module) => {
				entityMap[model] = module.default;
			})
		);
	}
	await Promise.all(modelPromises);
}

// reserved keywords from https://www.postgresql.org/docs/current/static/sql-keywords-appendix.html
const pgReserved = [
	'all',
	'analyse',
	'analyze',
	'and',
	'any',
	'array',
	'as',
	'asc',
	'asymmetric',
	'authorization',
	'binary',
	'both',
	'case',
	'cast',
	'check',
	'collate',
	'collation',
	'column',
	'concurrently',
	'constraint',
	'create',
	'cross',
	'current_catalog',
	'current_date',
	'current_role',
	'current_schema',
	'current_time',
	'current_timestamp',
	'current_user',
	'default',
	'deferrable',
	'desc',
	'distinct',
	'do',
	'else',
	'end',
	'except',
	'false',
	'fetch',
	'for',
	'foreign',
	'freeze',
	'from',
	'full',
	'grant',
	'group',
	'having',
	'ilike',
	'in',
	'initially',
	'inner',
	'intersect',
	'into',
	'is',
	'isnull',
	'join',
	'lateral',
	'leading',
	'left',
	'like',
	'limit',
	'localtime',
	'localtimestamp',
	'natural',
	'not',
	'notnull',
	'null',
	'offset',
	'on',
	'only',
	'or',
	'order',
	'outer',
	'overlaps',
	'placing',
	'primary',
	'references',
	'returning',
	'right',
	'select',
	'session_user',
	'similar',
	'some',
	'symmetric',
	'table',
	'tablesample',
	'then',
	'to',
	'trailing',
	'true',
	'union',
	'unique',
	'user',
	'using',
	'variadic',
	'verbose',
	'when',
	'where',
	'window',
	'with'
];

const pgIdentMax = 63;

class PgNamingStrategy extends UnderscoreNamingStrategy {
	classToTableName(input: string): string {
		let output = super.classToTableName(input);
		if (pgReserved.includes(output)) output += '_';
		if (output.length > pgIdentMax) {
			throw new Error(
				`classToTableName ${input} => ${output} length ${output.length} > max ${pgIdentMax}`
			);
		}
		return output;
	}

	joinColumnName(input: string): string {
		const output = super.joinColumnName(input);
		if (output.length > pgIdentMax) {
			throw new Error(
				`joinColumnName ${input} => ${output} length ${output.length} > max ${pgIdentMax}`
			);
		}
		return output;
	}

	joinKeyColumnName(
		entityName: string,
		referencedColumnName: string
	): string {
		const output = super.joinKeyColumnName(
			entityName,
			referencedColumnName
		);
		if (output.length > pgIdentMax) {
			throw new Error(
				`joinColumnName ${entityName} & ${referencedColumnName} => ${output} length ${output.length} > max ${pgIdentMax}`
			);
		}
		return output;
	}

	joinTableName(
		sourceEntity: string,
		targetEntity: string,
		propertyName: string
	): string {
		const output = super.joinTableName(
			sourceEntity,
			targetEntity,
			propertyName
		);
		if (output.length > pgIdentMax) {
			throw new Error(
				`joinTableName ${sourceEntity} & ${targetEntity} & ${propertyName} => ${output} length ${output.length} > max ${pgIdentMax}`
			);
		}
		return output;
	}

	propertyToColumnName(input: string): string {
		let output = super.propertyToColumnName(input);
		if (pgReserved.includes(output)) output += '_';
		if (output.length > pgIdentMax) {
			throw new Error(
				`propertyToColumnName ${input} => ${output} length ${output.length} > max ${pgIdentMax}`
			);
		}
		return output;
	}
}

const port =
	typeof process.env.DB_PORT === 'string'
		? parseInt(process.env.DB_PORT)
		: null;
if (port === null)
	throw new Error(
		'No port found, you can define env variables in the .env file'
	);

const config: Options<PostgreSqlDriver> = {
	dbName: process.env.DB_NAME ?? 'mikro_test',
	entities: Object.values(entityMap),
	host: process.env.DB_HOST ?? 'localhost',
	password: process.env.DB_PASS,
	port,
	cache: {
		enabled: true,
		pretty: true,
		options: {
			cacheDir: join(resolve(dirName, '..', 'dist'), 'models-cache')
		}
	},
	migrations: {
		path: join(dirName, 'migrations'),
		disableForeignKeys: false
	},
	loadStrategy: LoadStrategy.JOINED,
	namingStrategy: PgNamingStrategy,
	type: 'postgresql',
	user: process.env.DB_USER
};

export default config;
