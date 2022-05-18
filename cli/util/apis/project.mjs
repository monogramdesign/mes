import { fetch } from 'zx'

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
			} else {
				throw new Error(`${response.status} ${response.statusText}`)
			}
		})
		.catch((err) => {
			console.log('Some error occurred trying to create a new project: ', err)
		})
}

export { initNewProject }
