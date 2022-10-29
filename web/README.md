# Monogram UI - SvelteKit Edition

_The Monogram client boilerplate._

## Setup.

> `svelte-ui` is a GitHub template repository. That means you can use this as a template to create new repositories (without losing your baggage).

1. Create a new repository using GitHub
2. Select `svelte-ui` as the template to create it from
3. Type a shortened, lowercase, kebab-case repository name for your new repository. For example, "Sample Company" could be called `sample-co`. Use this everywhere.

### Package Settings

Update _(at least)_ these fields in `package.json`:

- `name` _(e.g. `sample-co`)_
- `description`
- `repository`
- `bugs`
- `contributors`

### Prismic

1. Create a new Prismic repository with the same "`sample-co`" name from above.
2. Add the repository name/URL to `prismic.config.js` and other applicable files.

## Install.

- `cd` to this directory and run `yarn install`

## Develop.

1. Run `yarn dev`
2. Visit the dev server at [`localhost:3000`](http://localhost:3000)

## Develop.

### HTML

1. Write good HTML
2. Don't repeat code
3. Never forget SEO & accessiblity

> You will need advanced knowledge of Svelte and SvelteKit to find your way around the source. While we will improve this documentation over time, in the meantime refer to [Svelte](https://svelte.dev/docs) and [SvelteKit](https://kit.svelte.dev/docs)'s documentation.

### CSS

1. Edit `tailwind.config.cjs` for variables
2. Use [Tailwind CSS](https://tailwindcss.com/docs) for as many styles as possible
3. Write custom styles in `global.scss`, preferably using the [`@layer`](https://tailwindcss.com/docs/adding-custom-styles#using-css-and-layer) syntax

## Deploy & Host on Vercel

Import project in [Vercel](https://vercel.com/new).

1. Connect your GitHub account to Vercel
2. Select the GitHub repo
3. If you are using the `static-adapter`, set the output directory to `build`
4. Deploy!
