import { fs, fetch } from 'zx'
import { DateTime } from 'luxon'

function backupCurrentEnvFile(envFileName) {
	// Make a copy of the current environment variables
	fs.copyFile(`./${envFileName}`, `./${envFileName}.bak`, (err) => {
		if (err) console.log('Error making a backup of the current envrionment variable: ', err)
	})
}

/**
 * Write the new environment variables to the file system
 * @param {*} envFileName
 * @param {*} mesApiKey
 * @param {*} mesProjectId
 * @param {*} latestSyncedVariable
 */
function writeNewEnvFile(envFileName, mesApiKey, mesProjectId, latestSyncedVariable) {
	// Do not modify the spacing inside this block
	let newEnvFile = `### MES - NOSYNC ###
LAST_UPDATE=${DateTime.now().toISO()}
### MES - NOSYNC ###

${latestSyncedVariable}`

	// Finally write the file
	fs.writeFile(`./${envFileName}`, newEnvFile, (err) => {
		if (err) console.log('Error writing new file: ', err)
	})
}

/**
 * Initialize a new project in MES; creates a new .env file; returns the projectId
 * @param {*} envFileName
 * @param {*} mesApiKey
 * @param {*} projectName
 * @param {*} orgId
 * @param {*} gitUrl
 */
async function initNewFile(envFileName) {
	// Do not modify the spacing inside this block
	let newEnvFile = `### MES - NOSYNC ###
LAST_UPDATE=${DateTime.now().toISO()}
### MES - NOSYNC ###`

	try {
		// Finally write the file
		fs.writeFileSync(`./${envFileName}`, newEnvFile, (err) => {
			if (err) console.log('Error writing new file: ', err)
		})
	} catch (error) {
		console.log('Error writing new file: ', error)
		return false
	}

	return true
}

function initNewConfigFile(params) {
	const { syncType, projectId, apiServer } = params

	const newConfigJson = `module.exports = {
	syncType: '${syncType}', // "file" or "variable"
	projectId: '${projectId}',
	apiServer: '${apiServer || 'https://api.mes.monogram.dev'}'
}
`

	try {
		fs.writeFileSync(`./mes.config.js`, newConfigJson, (err) => {
			if (err) console.log('Error writing "mes.config.js" file: ', err)
		})
	} catch (error) {
		console.log('Something went wrong.', error)
	}
}

/**
 * Check if the passed in file is already present in the project.
 *
 * @param {string} fileName file name
 * @returns {boolean} true if the file is present, false otherwise
 */
function checkFileExists(fileName) {
	try {
		if (fs.existsSync(fileName)) {
			return true
		}
	} catch (err) {
		console.error(err)
	}

	return false
}

export { initNewFile, backupCurrentEnvFile, writeNewEnvFile, initNewConfigFile, checkFileExists }
