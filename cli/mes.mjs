#! /usr/bin/env node

import { Command } from 'commander'
import { $, argv, cd, chalk, fs, fetch } from 'zx'
import { DateTime } from 'luxon'
import 'dotenv/config'
import * as mesConfig from './mes.config.js'

import { initNewFile, backupCurrentEnvFile, writeNewEnvFile } from './sync/file.mjs'

$.verbose = false

const config = mesConfig.default
const HOST = config.apiServer ? config.apiServer : 'https://api.mes.monogram.dev'

let packageJson = await fs.readFile('./package.json')
packageJson = JSON.parse(packageJson)

// Commander
const program = new Command()
program.name('mes').description('Monogram Env Sync (`mes`) CLI').version(packageJson.version)

program
	.command('init')
	.description(`Initialize a new project. (Use single quotes to wrap your project id and api key.)`)
	// .description('Example: mes init my-project-id abe20061-4199-4140-a4c2-1632b3b41146')
	.argument('<projectName>', 'The name of the new project to intialize.')
	.argument('<orgId>', 'Organization ID')
	.option('-k, --api-key <apikey>', 'Path to .env', '.env.local')
	.option('-e, --env-file <filename>', "Organization's API Key")
	.action(async (projectName, orgId) => {
		const options = program.opts()
		const envFileName = options.envFile || '.env.local'

		const envFile = await fs
			.readFile(envFileName)
			.then(() => {
				console.log(chalk.red(`Project already initialized into: ${envFileName}.`))
				process.exit(1)
			})
			.catch(async () => {
				// This will return undefined; we can use that to check if the file exists
			})

		// Get the api key
		const apikey = options.apiKey || process.env.MES_API_KEY

		if (envFile === undefined) {
			console.log('Initializing project...')
			const newProject = await initNewFile(envFileName, apikey, projectName, orgId, 'gitUrl', HOST)

			console.log(
				chalk.green(`✅ Initialized "${newProject.name}" with the project ID "${newProject.id}."`)
			)
		}
	})

program
	.command('sync')
	.description('Sync the local environment file with the remote environment file')
	.option('-e, --env-file <filename>', 'Path to .env', '.env.local')
	// .option('-u --up', 'Sync up to the server', false)
	.action(async () => {
		// Parse options
		const options = program.opts()
		const envFileName = options.envFile || '.env.local'

		const { mesProjectId, mesApiKey, updatedAt: fileUpdatedAt } = await getConfig(envFileName)

		// Get the Project Variables from the API
		const projEnvVariables = await getProjectVariables(mesApiKey, mesProjectId)
		const latestSyncedVariable = projEnvVariables?.[0]

		// ------------------------------------------------------------
		const remoteLatestUpdatedAt = DateTime.fromJSDate(new Date(latestSyncedVariable.updatedAt))
		const localFileUpdatedAt = DateTime.fromJSDate(new Date(fileUpdatedAt))
		// ------------------------------------------------------------

		// Is the local file updated before remote
		if (localFileUpdatedAt < remoteLatestUpdatedAt) {
			// Make a copy of the current environment variables
			backupCurrentEnvFile(envFileName)

			// Write the new environment variables to the file system
			writeNewEnvFile(envFileName, mesApiKey, mesProjectId, latestSyncedVariable?.content)
			return console.log(chalk.green('✅ Changes detected. Local file synced.'))
		} else {
			return console.log(chalk.blue('ℹ️ Local file is updated before remote, no need to sync.'))
		}
	})

/**
 * Write the new environment variables to the remote server
 */
program
	.command('push')
	.description('Push only the environment file to the remote environment.')
	.option('-e, --env-file <filename>', 'Path to .env', '.env.local')
	.action(async () => {
		const options = program.opts()
		const envFileName = options.envFile || '.env.local'
		const { mesProjectId, mesApiKey } = await getConfig(envFileName)

		// Read the local environment file
		const currentEnvFileFS = await readEnvFile(envFileName)

		// Get the array of environment variables
		const envVarArr = envVarToArr(currentEnvFileFS)

		// Prepare to save by removing config stuff and converting back into text
		const newVarUpdates = prepareToSaveEnvVar(envVarArr)

		pushUpdatesToRemoteServer(mesApiKey, mesProjectId, newVarUpdates)
	})

program.parse()

/**
 * Get the projectId and apiKey from the .env file
 *
 * @param {*} envFileName - The path to the .env file
 * @returns
 */
async function getConfig(envFileName) {
	// Read the local environment file
	const envFile = await readEnvFile(envFileName)
	const envFileLines = envFile.split('\n')

	// Get the Project ID
	const mesProjectId = config.projectId

	// Get the API Key
	const mesApiKey = process.env.MES_API_KEY

	// Get the latest updated date and time
	const updatedAtLine = envFileLines.find((line) => {
		if (line) return line.startsWith('LAST_UPDATE')
	})

	const updatedAt = updatedAtLine ? updatedAtLine.split('=')[1] : null

	return {
		mesProjectId,
		mesApiKey,
		updatedAt
	}
}

/**
 * Get the current environment variables from the file system
 *
 * @param {*} envFileName - The path to the .env file
 * @returns
 */
async function readEnvFile(envFileName) {
	if (!fs.existsSync(envFileName))
		fs.open(envFileName, 'wx', function (err, fd) {
			// handle error
			fs.close(fd, function (err) {
				// handle error
			})
		})

	return await (
		await $`cat ${envFileName}`
	).stdout
}

async function getProjectVariables(apiKey, projectId) {
	let resp = await fetch(`${HOST}/project/${projectId}`, {
		headers: {
			'X-Api-Key': apiKey
		}
	})

	if (resp.ok) {
		let response = await resp.text()
		response = JSON.parse(response)

		return response.envContent
	}
}

/**
 * Convert env file to array
 * @param {*} envVar the raw enviroment variable text
 * @returns
 */
function envVarToArr(envVar) {
	return envVar.split('\n').map((line) =>
		line.split('=').map((item) => {
			return item.trim()
		})
	)
}

/**
 * Convert the enviroment variable array to a string to be saved to the remote server
 *
 * @param {Arr} envVarArr - enviroment variable array
 * @returns
 */
function prepareToSaveEnvVar(envVarArr) {
	const filteredEnvVarArr = envVarArr.filter((item) => {
		if (item.length > 0) return item[0] !== 'LAST_UPDATE' && item[0].includes('NOSYNC') === false
	})

	// Remove first element if it's empty (usually a new line)
	if (filteredEnvVarArr[0][0].length === 0) filteredEnvVarArr.shift()

	// Put it back together
	return filteredEnvVarArr
		.map((line) => {
			if (line.length > 1) return `${line[0]}=${line[1]}`
			else {
				return line[0]
			}
		})
		.join('\n')
}

async function pushUpdatesToRemoteServer(apiKey, projectId, newVarUpdates) {
	fetch(`${HOST}/env`, {
		method: 'POST',
		headers: {
			'X-Api-Key': apiKey,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			envFileContents: newVarUpdates,
			projectId: projectId
		})
	})
		.then((response) => {
			if (response.ok) {
				return response.json()
			}

			return Promise.reject(response)
		})
		.then((result) => {
			console.log(result)
		})
		.catch((error) => {
			console.log('Something went wrong.', error)
		})

	// if (resp.ok) {
	// 	let response = await resp.text()
	// 	response = JSON.parse(response)

	// 	return response.envContent
	// } else console.log(resp)
}
