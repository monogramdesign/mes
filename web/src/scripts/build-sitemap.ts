import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { createSitemap } from 'svelte-sitemap/src/index'

const domain = 'https://example.com'

const outDir = '.vercel/output/static'
const sitemapPath = join(outDir, 'sitemap.xml')

const buildSitemap = async () => {
	await createSitemap(domain, {
		outDir
	})

	// Remove `.html` from every sitemap URL
	let sitemap = readFileSync(join(process.cwd(), sitemapPath), 'utf-8')
	if (sitemap) {
		sitemap = sitemap.replace(/\.html<\/loc>/gm, '</loc>')
		writeFileSync(sitemapPath, sitemap)
	}
}

export default buildSitemap
