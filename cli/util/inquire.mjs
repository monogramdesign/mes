import { chalk, fetch } from 'zx'

import inquirer from 'inquirer'
import inquirerPrompt from 'inquirer-autocomplete-prompt'
inquirer.registerPrompt('autocomplete', inquirerPrompt)

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

async function inquireExistingProjectDetails(apiServer, apiKey) {
	return await inquirer
		.prompt([
			{
				type: 'input',
				name: 'apiServer',
				message: 'What is the API Server URL?',
				default() {
					return apiServer
				}
			},
			{
				type: 'autocomplete',
				name: 'projectId',
				message: 'Search for an existing project by name:',
				searchText: 'We are searching the internet for you!',
				emptyText: 'Nothing found!',
				source: async (answersSoFar, input = '') => {
					const projects = await fetch(`${answersSoFar.apiServer}/projects/search?q=${input}`, {
						headers: {
							'X-Api-Key': apiKey
						}
					})

					if (projects.status === 200) {
						const projectsJson = await projects.json()
						return projectsJson.map((project) => `${project.name} (${project.id.split('-').pop()})`)
					}

					return []
				},
				validate(choice) {
					return choice ? true : 'Type something!'
				}
			}
		])
		.then((answers) => {
			console.log('answersanswersanswers', answers)
			return answers
		})
}

export { inquireNewProjectDetails, inquireExistingProjectDetails }
