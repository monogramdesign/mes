import Hapi from '@hapi/hapi'
import { Prisma } from '@prisma/client'
/*
 * TODO: We can't use this type because it is available only in 2.11.0 and previous versions
 * In 2.12.0, this will be namespaced under Prisma and can be used as Prisma.UserCreateInput
 * Once 2.12.0 is release, we can adjust this example.
 */
// import { UserCreateInput } from '@prisma/client'

// plugin to instantiate Prisma Client
const usersPlugin = {
	name: 'app/users',
	dependencies: ['prisma'],
	register: async function (server: Hapi.Server) {
		server.route([
			{
				method: 'GET',
				path: '/users',
				handler: getAllUsersHandler
			}
		])
	}
}

export default usersPlugin

async function getAllUsersHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
	const { prisma } = request.server.app

	try {
		const users = await prisma.user.findMany()
		return h.response(users).code(200)
	} catch (err) {
		console.log(err)
	}
}
