import { minify } from 'html-minifier'
import type { Options } from 'html-minifier'
import type { Handle } from '@sveltejs/kit'

const minification_options: Options = {
	caseSensitive: true,
	collapseBooleanAttributes: true,
	collapseWhitespace: true,
	conservativeCollapse: true,
	decodeEntities: true,
	html5: true,
	removeAttributeQuotes: true,
	removeComments: true,
	removeOptionalTags: true,
	removeRedundantAttributes: true,
	removeScriptTypeAttributes: true,
	removeStyleLinkTypeAttributes: true,
	sortAttributes: true,
	sortClassName: true
}

export const handle: Handle = async ({ event, resolve }) =>
	await resolve(event, {
		transformPageChunk: ({ html }) => minify(html, minification_options)
	})
