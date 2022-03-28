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
async function initNewFile(envFileName, apiKey, projectName, orgId, gitUrl, HOST) {
	return (
		fetch(`${HOST}/project`, {
			method: 'POST',
			headers: {
				'X-Api-Key': apiKey,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: projectName,
				orgId: orgId,
				gitUrl: gitUrl
			})
		})
			.then(async (response) => {
				if (response.ok) {
					const responseJson = await response.json()

					// Do not modify the spacing inside this block
					let newEnvFile = `### MES - NOSYNC ###
LAST_UPDATE=${DateTime.now().toISO()}
### MES - NOSYNC ###`

					// Finally write the file
					fs.writeFile(`./${envFileName}`, newEnvFile, (err) => {
						if (err) console.log('Error writing new file: ', err)
					})

					return responseJson
				}

				return Promise.reject(response)
			})
			// .then((result) => {
			// 	console.log(result)
			// })
			.catch((error) => {
				console.log('Something went wrong.', error)
			})
	)
}

export { initNewFile, backupCurrentEnvFile, writeNewEnvFile }
