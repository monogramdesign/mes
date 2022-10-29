<script lang="ts">
	type PrismicPlainText = { text: string }[]
	type ComponentType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'

	export let content: string | PrismicPlainText
	export let as: ComponentType = 'p'
	export let className = ''
	export { className as class }

	$: text = (content as PrismicPlainText)?.[0]?.text ?? content
</script>

{#if typeof text === 'string' && as}
	{@html `<${as} class="${className}">${text}</${as}>`}
{/if}
