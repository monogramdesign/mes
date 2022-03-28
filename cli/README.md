# Monogram Env Sync

Monogram Env Sync (`mes`) is a tool to sync up a project's .env file.

## Install

To install run the following command:

```sh
npm i -g @monogram/mes-cli
```

## How to use

### Configure

#### Set up your API Key

You add your api key in your `~/.zshrc` or `~/.bashrc`.

```
### Monogram Env Sync
export MES_API_KEY=<org_api_key>
```

#### Configure your project

Add `mes.config.js` to your project.

```js
// Sample mes.config.js
module.exports = {
	projectId: '687260eb-133f-4cf5-b50d-ce7edf951d37',
	apiServer: 'http://localhost:4000'
}
```

| Property    | Optional? | Description                                |
| ----------- | --------- | ------------------------------------------ |
| `projectId` | false     | The project ID in Env Sync                 |
| `apiServer` | true      | The API server if you're running your own. |

### Run

Run it manually

```sh
mes
```

Add to your project like

```json
"scripts": {
  "dev": "mes && next dev -p 3007",
  ...
}
```

Maybe just add this to `package.json` instead of `mes.config.js`

```js
	"mes": {
		"projectId": "a8504b81-05c6-4170-8d20-cb0b848c7d44",
		"apiServer": "http://localhost:4000"
	},
```
