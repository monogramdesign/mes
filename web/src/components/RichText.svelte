<script lang="ts">
	import { asHTML } from '@prismicio/helpers'
	import linkResolver from '$lib/prismic/link-resolver'
	import htmlSerializer from '$lib/prismic/serializer'

	// Props
	export let content: any
	let className = ''
	export { className as class }
</script>

{#if Boolean(content)}
	<div class={className}>
		{@html asHTML(content, linkResolver, htmlSerializer)}
	</div>
{/if}
