import core from '@actions/core'
import github from '@actions/github'
import Issues from './src/issues.js'

try {
	const ctx = github.context

	core.debug(`payload: ${JSON.stringify(ctx.payload, undefined, 2)}`)
	if (!ctx.payload.pull_request) {
		throw new Error('not a pull_request payload')
	}

	const event = ctx.payload.pull_request

	const owner = core.getInput('owner') ? core.getInput('owner') : ctx.repo.owner
	const repository = core.getInput('repository') ? core.getInput('repository') : ctx.repo.repo
	const component = core.getInput('component') ? core.getInput('component') : repository
	const token = core.getInput('github-token') ? core.getInput('github-token') : process.env.GITHUB_TOKEN

	if (!token) {
		throw new Error('Missing github-token (input, env)')
	}

	core.info(`will update ${owner}/${repository} about merge`)

	const issues = new Issues(owner, repository, component, token)

	issues.initLabels().then(() => {
		issues.find().then((issue) => {
			core.info(`found: ${owner}/${repository}#${issue.number} - ${issue.url}`)
			issues.update(issue, event).then((status) => {
				if (!status) {
					throw new Error('unable to update issue')
				}
				core.setOutput('issue', issue.number)
				core.setOutput('issue_url', issue.html_url)
			})
		})
	})
} catch (error) {
	core.setFailed(error.message)
}
