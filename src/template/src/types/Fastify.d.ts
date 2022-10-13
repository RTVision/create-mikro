import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import type { FastifyBaseLogger, FastifyInstance } from 'fastify';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Server } from 'https';

export declare type Fastify = FastifyInstance<
	Server,
	IncomingMessage,
	ServerResponse,
	FastifyBaseLogger,
	JsonSchemaToTsProvider
>;
