import { fs, fetch } from 'zx'

async function initNewProject(apiKey, projectName, orgId, gitUrl, HOST) {
	return fetch(`${HOST}/project`, {
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
				return await response.json()
			}
		})
		.catch((err) => {
			console.log('Some error occurred trying to create a new project: ', err)
		})

	// return Promise.reject(response)
}

export { initNewProject }
