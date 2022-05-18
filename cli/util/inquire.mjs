import { fetch } from 'zx'

import inquirer from 'inquirer'
import inquirerPrompt from 'inquirer-autocomplete-prompt'
inquirer.registerPrompt('autocomplete', inquirerPrompt)

async function inquireAppInit() {
	return await inquirer
		.prompt([
			{
				type: 'input',
				name: 'orgId',
				message: "What is your organization's ID?",
				validate: function (value) {
					if (value.length) {
						return true
					} else {
						return 'Please enter an organization ID (e.g. 36ff4545-fcdf-46c7-9bf2-df4e3a85bdea).'
					}
				}
			},

			{
				type: 'input',
				name: 'apiKey',
				message: "What is your organization's API Key?",
				validate: function (value) {
					if (value.length) {
						return true
					} else {
						return 'Please enter an API Key (e.g. prod_b3958823dd788790030990bbb...).'
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

async function inquireNewProjectDetails(API_SERVER) {
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
					return API_SERVER
				}
			}
		])
		.then((answers) => {
			return answers
		})
}

async function inquireExistingProjectDetails(API_SERVER, apiKey) {
	return await inquirer
		.prompt([
			{
				type: 'input',
				name: 'apiServer',
				message: 'What is the API Server URL?',
				default() {
					return API_SERVER
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
						return projectsJson.map((project) => `${project.name} (${project.id})`)
					}

					return []
				},
				validate(choice) {
					return choice ? true : 'Type something!'
				}
			}
		])
		.then((answers) => {
			return answers
		})
}

export { inquireAppInit, inquireNewProjectDetails, inquireExistingProjectDetails }
