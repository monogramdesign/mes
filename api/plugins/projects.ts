import Hapi from '@hapi/hapi'
// import { Prisma } from '@prisma/client'
/*
 * TODO: We can't use this type because it is available only in 2.11.0 and previous versions
 * In 2.12.0, this will be namespaced under Prisma and can be used as Prisma.UserCreateInput
 * Once 2.12.0 is release, we can adjust this example.
 */
// import { UserCreateInput } from '@prisma/client'

// plugin to instantiate Prisma Client
const projectsPlugin = {
	name: 'app/projects',
	dependencies: ['prisma'],
	register: async function (server: Hapi.Server) {
		server.route([
			/**
			 * Get a list of all the projects for an org
			 */
			{
				method: 'GET',
				path: '/projects',
				handler: getAllProjectsHandler
			}
		]),
			/**
			 * Get a list of all the projects for an org
			 */
			server.route([
				{
					method: 'GET',
					path: '/project/{projectId}',
					handler: getProjectDetailsHandler
				}
			]),
			/**
			 * Create a new project
			 */
			server.route([
				{
					method: 'POST',
					path: '/project',
					handler: newProjectHandler
				}
			]),
			/**
			 * Add a new environment variable file content to the project.
			 */
			server.route([
				{
					method: 'POST',
					path: '/env',
					handler: newEnvFileHandler
				}
			])
	}
}

export default projectsPlugin

async function getAllProjectsHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
	const { prisma } = request.server.app
	const apiKey = request.headers['x-api-key']

	// return 400 if apiKey or projectId is missing
	if (!apiKey) return h.response({ message: 'Missing API key or projectId.' }).code(400)

	try {
		// Make sure we can find the project using the provided API key
		const projects = await prisma.project.findMany({
			where: {
				AND: {
					org: {
						apiKeys: {
							some: {
								key: apiKey
							}
						}
					}
				}
			}
			// include: {
			// 	apiKeys: true
			// }
		})

		// return 204 if project not found
		if (!Array.isArray(projects) || projects.length <= 0) return h.response().code(204)
		else return h.response(projects).code(200)
	} catch (err) {
		console.log(err)
	}
}

/**
 *
 * @param request
 * @param h
 * @returns
 */
async function getProjectDetailsHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
	const { prisma } = request.server.app

	const { projectId } = request.params as any
	const apiKey = request.headers['x-api-key']

	// return 400 if apiKey or projectId is missing
	if (!apiKey || !projectId)
		return h.response({ message: 'Missing API key or projectId.' }).code(400)

	try {
		// Make sure we can find the project using the provided API key
		const project = await prisma.project.findMany({
			where: {
				AND: {
					id: projectId,
					org: {
						apiKeys: {
							some: {
								key: apiKey
							}
						}
					}
				}
			}
		})

		// return 204 if project not found
		if (!Array.isArray(project) || project.length <= 0) return h.response().code(204)

		// Get the variables for the project
		const variables = await prisma.variable.findMany({
			where: {
				projectId: project[0].id
			},
			take: 10,
			orderBy: {
				createdAt: 'desc'
			}
		})

		const retval =
			Array.isArray(project) && project.length > 0
				? {
						project: project[0],
						envContent: variables
				  }
				: null

		return retval ? h.response(retval).code(200) : null
	} catch (err) {
		console.log(err)
	}
}

/**
 *
 * @param request
 * @param h
 * @returns
 */
async function newProjectHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
	const { prisma } = request.server.app

	const apiKey = request.headers['x-api-key']
	const { orgId, name, gitUrl } = request.payload as any

	// return 400 if apiKey or projectId is missing
	if (!apiKey || !orgId || !name)
		return h.response({ message: 'Missing API key, orgId or other error.' }).code(400)

	try {
		// Make sure we can find the project using the provided API key
		const org = await prisma.org.findMany({
			where: {
				AND: {
					id: orgId,
					apiKeys: {
						some: {
							key: apiKey
						}
					}
				}
			}
			// include: {
			// 	apiKeys: true
			// }
		})

		// If we can't find the org with the provided api key, return 400
		if (org.length <= 0) return h.response({ message: 'Invalid Org Id or API key.' }).code(400)

		// Create the project
		const createdProject = await prisma.project.create({
			data: {
				orgId,
				name,
				gitUrl: gitUrl ? gitUrl : null
			}
		})

		return h.response({ ...createdProject, success: true }).code(201)
	} catch (err) {
		console.log(err)
	}
}

/**
 *
 * @param request
 * @param h
 * @returns
 */
async function newEnvFileHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
	const { prisma } = request.server.app

	const apiKey = request.headers['x-api-key']
	const { envFileContents, projectId } = request.payload as any
	// const { projectId } = request.params as any

	// return 400 if apiKey or projectId is missing
	if (!apiKey || !projectId)
		return h.response({ message: 'Missing API key or project id error.' }).code(400)

	try {
		// Make sure we can find the project using the provided API key
		const project = await prisma.project.findMany({
			where: {
				AND: {
					id: projectId,
					org: {
						apiKeys: {
							some: {
								key: apiKey
							}
						}
					}
				}
			}
		})

		// If we can't find the prject with the provided api key, return 400
		if (project.length <= 0) return h.response({ message: 'Invalid Project or API key.' }).code(400)

		// Add a new row with the env file contents to the db
		const environmentFileContents = await prisma.variable.create({
			data: {
				projectId: projectId,
				content: envFileContents
			}
		})

		// If created successfully, return a success message
		if (environmentFileContents)
			return h
				.response({
					message: `New variable added successfully.`,
					date: environmentFileContents.createdAt,
					success: true
				})
				.code(201)
		else
			return h.response({ message: 'Error creating environment file.', success: false }).code(400)
	} catch (err) {
		console.log(err)
	}
}
