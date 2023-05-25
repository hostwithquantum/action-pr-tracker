import { describe, expect, test } from 'vitest'
import Issues from './issues.js'

describe.skipIf(process.env.CI_GITHUB_TOKEN === undefined)('issues', () => {
	const token = process.env.CI_GITHUB_TOKEN
	console.log(token)

	test('create new', () => {
		const issues = new Issues('hostwithquantum', 'action-pr-tracker', 'vitest', token)

		const randomNumber = Math.floor(Math.random() * 999)

		// fake event (from github.context.payload.pull_request)
		const e = {
			title: `random title (${randomNumber})`,
			html_url: `https://github.com/repo/pulls/${randomNumber}`,
		}

		issues.find().then((issue) => {
			issues
				.update(issue, e)
				.then((status) => {
					expect(status).toBeTypeOf('boolean')
					expect(status).toBe(true)
				})
				.catch((error) => {
					throw new Error(`this shouldn't happen: ${error.message}`)
				})
		})
	})

	test.todo('update existing', async () => {})
})
