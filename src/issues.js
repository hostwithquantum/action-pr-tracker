import core from '@actions/core'
import { Octokit } from '@octokit/rest'
import fs from 'fs'

const appName = 'pr-tracker'
const requestHeaders = {
	'X-GitHub-Api-Version': '2022-11-28',
}

const appVersion = JSON.parse(fs.readFileSync(`package.json`, 'utf8')).version

export default class Issues {
	/**
	 * @param {string} owner
	 * @param {string} repository
	 * @param {string} component
	 * @param {string} token
	 */
	constructor(owner, repository, component, token) {
		this.owner = owner
		this.repository = repository
		this.component = component
		this.kit = this.createKit(token)
	}

	async initLabels() {
		const labels = [appName, this.createComponentLabel()]

		labels.forEach(async (label) => {
			this.kit
				.request('POST /repos/{owner}/{repo}/labels', {
					owner: this.owner,
					repo: this.repository,
					name: label,
					headers: requestHeaders,
				})
				.then((response) => {
					core.info(`created label: ${response.data.name}`)
				})
				.catch((error) => {
					// ignore error
					core.info(`label probably (already) exists: ${error.message} (code: ${error.code})`)
				})
		})
	}

	async find() {
		const labels = [appName, this.createComponentLabel()]

		// look for an open issue for the component
		const parameters = {
			owner: this.owner,
			repo: this.repository,
			labels: labels.join(','),
			state: 'open',
			headers: requestHeaders,
		}

		return this.kit.rest.issues.listForRepo(parameters).then((response) => {
			if (response.data.length == 1) {
				return response.data[0]
			}
			return this.kit.rest.issues
				.create({
					owner: this.owner,
					repo: this.repository,
					title: `release required: ${this.component}`,
					labels: labels,
					body: 'the following PRs were closed:\n\n',
					headers: requestHeaders,
				})
				.then((response) => {
					return response.data
				})
				.catch((error) => {
					throw new Error(`unable to create issue: ${error.message} (${error.code})`)
				})
		})
	}

	async update(issue, event) {
		// append to body
		issue.body += `\n- [${event.title}](${event.html_url})`

		if (!issue.assignee) {
			// null value
			delete issue.assignee
		}

		return this.kit.rest.issues
			.update(issue)
			.then(() => {
				return true
			})
			.catch((error) => {
				const data = JSON.stringify(error)

				if (error.status == 403) {
					throw new Error(`probably a permission problem with the token: ${data}`)
				}

				throw new Error(`unable to update issue: ${data}`)
			})
	}

	createComponentLabel() {
		return `${appName}:${this.component}`
	}

	createKit(token) {
		return new Octokit({
			auth: token,
			userAgent: `hostwithquantum/action-pr-tracker@${appVersion}`,
		})
	}
}
