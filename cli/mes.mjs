#! /usr/bin/env node

import { Command } from 'commander'
import { $, chalk, fs, fetch } from 'zx'
import { DateTime } from 'luxon'

import inquirer from 'inquirer'
import 'dotenv/config'
// import * as mesConfig from './mes.config.js'

import {
	initNewFile,
	backupCurrentEnvFile,
	writeNewEnvFile,
	initNewConfigFile,
	checkFileExists
} from './util/file.mjs'

import { initNewProject } from './util/apis/project.mjs'
import { inquireNewProjectDetails, inquireExistingProjectDetails } from './util/inquire.mjs'
import { PROJECT_NAME, PROJECT_VERSION } from './util/constants.mjs'

// Global variables
// Get the API Key
const API_KEY = process.env.MES_API_KEY
const ORG_ID = process.env.MES_ORG_ID

if (!API_KEY || !ORG_ID) {
	console.log(chalk.red(`❌ API_KEY and ORG_ID not available.`))
	console.log(`
To make it easier you should add them in your ~/.zshrc file.

  export MES_API_KEY=<your-api-key>
  export MES_ORG_ID=<your-org-id>
`)

	process.exit(1)
}

let config = null
let API_SERVER = process.env.MES_API_SERVER || 'https://api.mes.monogram.dev'

$.verbose = false

// Commander
const program = new Command()
program.name('mes').description(PROJECT_NAME).version(PROJECT_VERSION)

program
	.command('init')
	.description(`Initialize a new project. (Use single quotes to wrap your <orgId> and <apikey>.)`)
	.option('-o, --orgId <orgId>', 'Organization ID')
	.option('-k, --api-key <apikey>', "Organization's API Key")
	.option('-e, --env-file <filename>', 'Path to .env', '.env.local')
	.option(
		'-f, --force',
		'Force the initialization of the project. Overwrite the existing config and .env file.',
		false
	)
	.action(async (options) => {
		// console.log('-> options', options, '\n')
		console.log(PROJECT_NAME, PROJECT_VERSION, '\n')

		// Get the api key
		const orgId = options.orgId || ORG_ID
		const initApiKey = options.apikey || API_KEY
		const envFileName = options.envFile || '.env.local'

		const initAnswers = await inquirer
			.prompt([
				{
					type: 'list',
					name: 'projectType',
					message: 'Initialize a project?',
					choices: ['Existing', 'New']
				}
			])
			.then(async (answers) => {
				if (answers.projectType === 'New') {
					const projectDetails = await inquireNewProjectDetails(API_SERVER)
					return { ...answers, ...projectDetails }
				} else {
					const projectDetails = await inquireExistingProjectDetails(API_SERVER, initApiKey)
					console.log('projectDetails', projectDetails)
					return {
						...answers,
						...projectDetails,
						projectId: /\(([^)]*)\)/.exec(projectDetails.projectId)[1]
					}
				}
			})

		// User FYI
		console.log(
			`\nThe following ${chalk.cyan(
				initAnswers.projectType.toLowerCase()
			)} project is being intialized:\n`,
			initAnswers,
			'\n'
		)

		if (!checkFileExists('mes.config.js') || options.force) {
			const initProject =
				initAnswers.projectType === 'New'
					? await initNewProject(
							initApiKey,
							initAnswers?.projectName,
							orgId,
							'gitUrl', // FIXME: ask for github url
							initAnswers?.apiServer
					  )
					: { id: initAnswers.projectId }

			// initialize the new config file
			await initNewConfigFile({
				syncType: 'file',
				projectId: initProject.id,
				apiServer: initAnswers?.apiServer
			})

			// initialize the new .env file
			const envFile = await fs.readFile(envFileName)

			if (envFile === undefined || options.force) {
				const newEnvFile = await initNewFile(
					envFileName,
					initApiKey,
					initProject?.name,
					orgId,
					'gitUrl', // FIXME: ask for github url
					API_SERVER
				)

				if (initProject?.id && newEnvFile)
					console.log(
						chalk.green(
							`✅ Initialized ${
								initProject.name ? initProject.name : 'an existing project'
							} with the ID "${initProject.id}."`
						)
					)
				else return console.log(chalk.red(`❌ Something went wrong.`))
			}
		}

		// ❌ mes.config.js or -f is not provided
		else {
			console.log(
				chalk.red(`Project already initialized into: ${envFileName}. Use -f to overwrite. [2]`)
			)
			process.exit(1)
		}
	})

program
	.command('sync')
	.description('Sync the local environment file with the remote environment file')
	.option('-e, --env-file <filename>', 'Path to .env', '.env.local')
	// .option('-u --up', 'Sync up to the server', false)
	.action(async () => {
		// Load config
		await loadConfig()

		if (canExecute()) {
			// Parse options
			const options = program.opts()
			const envFileName = options.envFile || '.env.local'

			const { mesProjectId, updatedAt: fileUpdatedAt } = await getConfig(envFileName)

			// Get the Project Variables from the API
			const projEnvVariables = await getProjectVariables(API_KEY, mesProjectId)

			// If the project is not found, exit
			if (!projEnvVariables)
				return console.log(
					chalk.red(
						`❌ The project with id "${mesProjectId}" was not found, or your API key is invalid.`
					)
				)

			// Project synced before; continue
			if (projEnvVariables.length > 0) {
				const latestSyncedVariable = projEnvVariables?.[0]

				// ----------------------------------------------------------------------------------------
				const remoteLatestUpdatedAt = DateTime.fromJSDate(new Date(latestSyncedVariable.updatedAt))
				const localFileUpdatedAt = DateTime.fromJSDate(new Date(fileUpdatedAt))
				// ----------------------------------------------------------------------------------------

				// Is the local file updated before remote
				if (localFileUpdatedAt < remoteLatestUpdatedAt) {
					// Make a copy of the current environment variables
					backupCurrentEnvFile(envFileName)

					// Write the new environment variables to the file system
					writeNewEnvFile(envFileName, API_KEY, mesProjectId, latestSyncedVariable?.content)
					return console.log(chalk.green('✅ Changes detected. Local file synced with the server.'))
				} else {
					return console.log(chalk.blue('ℹ️ Local file is updated before remote, no need to sync.'))
				}
			}

			// Project never synced before
			else {
				console.log(chalk.blue('ℹ️ Project never synced before.'))
			}
		} else {
			errorMsg('noConfig')
		}

		process.exit(1)
	})

/**
 * Write the new environment variables to the remote server
 */
program
	.command('push')
	.description('Push only the environment file to the remote environment.')
	.option('-e, --env-file <filename>', 'Path to .env', '.env.local')
	.action(async () => {
		// Load config
		await loadConfig()

		if (canExecute()) {
			const options = program.opts()
			const envFileName = options.envFile || '.env.local'
			const { mesProjectId } = await getConfig(envFileName)

			// Read the local environment file
			const currentEnvFileFS = await readEnvFile(envFileName)

			// Get the array of environment variables
			const envVarArr = envVarToArr(currentEnvFileFS)

			// Prepare to save by removing config stuff and converting back into text
			const newVarUpdates = prepareToSaveEnvVar(envVarArr)

			// Save the new environment variables file to the remote server
			const pushRest = await pushUpdatesToRemoteServer(API_KEY, mesProjectId, newVarUpdates)

			// If the push was unsuccessful, exit and show message.
			if (!pushRest.success) return console.log(chalk.red(`❌ ${pushRest.message}`))

			return console.log(chalk.green(`✅ ${pushRest.message}\n   ${pushRest.date}`))
		}
	})

program.parse()

/**
 * Moved to a separate method to handle other checks in the future.
 * @returns {boolean} - True if the config file exists
 */
function canExecute() {
	return !!config
}

/**
 * Moved to a separate method to handle different error messages.
 * @param {string} type error type
 * @returns console error messages
 */
function errorMsg(type) {
	switch (type) {
		case 'noConfig':
			return console.error(chalk.red('❌ No config found. Run "mes init" first.'))
			break

		default:
			break
	}
}

async function loadConfig() {
	// Load config file if exists
	if (fs.existsSync('./mes.config.js')) {
		const mesConfig = await import('./mes.config.js')

		config = mesConfig.default
		if (config.apiServer) API_SERVER = config.apiServer
	}
}

/**
 * Get the projectId and apiKey from the .env file
 *
 * @param {*} envFileName - The path to the .env file
 * @returns
 */
async function getConfig(envFileName, projectId) {
	// Read the local environment file
	const envFile = await readEnvFile(envFileName)
	const envFileLines = envFile.split('\n')

	// Get the Project ID
	const mesProjectId = config.projectId

	// Get the latest updated date and time
	const updatedAtLine = envFileLines.find((line) => {
		if (line) return line.startsWith('LAST_UPDATE')
	})

	const updatedAt = updatedAtLine ? updatedAtLine.split('=')[1] : null

	return {
		mesProjectId,
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
	let resp = await fetch(`${API_SERVER}/project/${projectId}`, {
		headers: {
			'X-Api-Key': apiKey
		}
	})

	if (resp.ok) {
		if (resp.status === 204) return false

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
	return await fetch(`${API_SERVER}/push-file`, {
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
		.then(async (response) => {
			if (response.ok) {
				return await response.json()
			}

			return Promise.reject(response)
		})
		.then((result) => {
			return result
		})
		.catch(async (error) => {
			const resp = await error.json()
			return { success: false, ...resp }
		})
}
