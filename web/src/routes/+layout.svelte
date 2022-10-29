<script lang="ts">
	import '@fontsource/open-sans/latin-400.css'
	import '$styles/global.scss'

	import SvelteSeo from 'svelte-seo'

	import Nav from '$components/layout/Nav.svelte'
	import Footer from '$components/layout/Footer.svelte'
</script>

<!-- Google Fonts -->
<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter&family=Mukta&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<!-- SEO -->
<SvelteSeo
	title="Svelte UI - Template Repo"
	description="Svelte UI template repo by Monogram Design @ monogram.io"
/>

<Nav />
<main>
	<slot />
</main>
<Footer />
