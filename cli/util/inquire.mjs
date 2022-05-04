import inquirer from 'inquirer'

async function inquireNewProjectDetails() {
	return await inquirer
		.prompt([
			{
				type: 'input',
				name: 'projectName',
				message: 'What is the name of the new project?',
				validate: function (value) {
					if (value.length) {
						return true
					} else {
						return 'Please enter a project name.'
					}
				}
			},

			{
				type: 'input',
				name: 'apiServer',
				message: 'What is the API Server URL?',
				default() {
					return 'https://api.mes.monogram.dev'
				}
			}
		])
		.then((answers) => {
			return answers
		})
}

async function inquireExistingProjectDetails() {
	// TODO: Look up project names and IDs from the API
	return await inquirer
		.prompt([
			{
				type: 'input',
				name: 'projectId',
				message: 'What is the Project ID?',
				validate: function (value) {
					if (value.length) {
						return true
					} else {
						return 'Please enter a Project ID.'
					}
				}
			},

			{
				type: 'input',
				name: 'apiServer',
				message: 'What is the API Server URL?',
				default() {
					return 'https://api.mes.monogram.dev'
				}
			}
		])
		.then((answers) => {
			return answers
		})
}

export { inquireNewProjectDetails, inquireExistingProjectDetails }
