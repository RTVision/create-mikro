#!/usr/bin/env node
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import chalk from 'chalk';
import fsExtra from 'fs-extra';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const dirName = dirname(fileURLToPath(import.meta.url));
const {
	positionals: [projectName]
} = parseArgs({
	allowPositionals: true
});

function log(chalkFunction, msg) {
	console.log(chalk[chalkFunction](msg));
}

if (typeof projectName !== 'string' || projectName.length === 0) {
	log(
		red,
		'Name of project is required parameter. i.e. pnpm @rtvision/create-mikro vite-mikro-repro'
	);
	process.exit(0);
}

const workingDir = process.cwd();
const projectPath = join(workingDir, projectName);

try {
	existsSync(projectName);
} catch (e) {
	log('red', `${projectName} already exists`);
}

try {
	log('cyan', 'Making project dir');
	mkdirSync(projectPath);
	log('green', 'success');
	log('cyan', 'copying template files');
	fsExtra.copySync(resolve(dirName, '..', 'src', 'template'), projectPath);
	log('green', 'success');
	log('cyan', 'replacing template variables');
	const packageJsonPath = join(projectPath, 'package.json');
	execSync(`sed -i 's/{packageName}/${projectName}/' /${packageJsonPath}`);
	log('green', 'success');
	log('cyan', 'running setup commands');
	execSync(
		`cd ${projectPath} && git init --initial-branch master && git remote add origin git@github.com:RTVision/${projectName}.git && (pnpm i || true)`
	);
	log('green', 'project is bootstrapped');
} catch (e) {
	log('red', 'error detected, cleaning up');
	fsExtra.rmSync(projectPath, { recursive: true });
	throw e;
}
