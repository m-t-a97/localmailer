# Contribution Guide

### Code of Conduct

This project is committed to fostering a welcoming and inclusive community. As a contributor,
you agree to uphold the principles outlined in the [Code of Conduct](./CODE_OF_CONDUCT.md). If
you have concerns or encounter any unacceptable behavior, please reach out to mta.coder97@gmail.com.

---

### I Want To Contribute

> ### Legal Notice
>
> By contributing to this project, you agree that you are the original author of the contributed material and that you have the necessary rights to contribute it, and that the contributed material may be distributed under the project's license.

### Submit issues

### Reporting bugs

We rely on bug reports to enhance this project for all users. To assist us, we have a bug reporting template specifying the necessary details. Ensure you check our [existing bug reports](https://github.com/m-ta97/localmailer/issues?q=is%3Aissue+is%3Aopen+label%3Abug) prior to submitting a new one to avoid duplicates.

### Reporting security issues

Avoid creating a public GitHub issue for security concerns. If you discover a security vulnerability, contact us directly via email at mta.coder97@gmail.com rather than opening an issue.

### Requesting new features

To request new features, please create an issue on this project.
To ensure that we can understand the problem you are looking to solve, please be as detailed as possible.
To see what other people have already suggested, you can look [here](https://github.com/m-t-a97/localmailer/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement).
Please be aware that duplicate issues might already exist. If you are creating a new issue, please check existing open, or recently closed. Having a single vote for an issue is far easier for us to prioritise.

---

### Begin Contributing

#### Requirements

To start contributing:

- [Fork](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo) the repository
- Clone the fork on your workstation:

```bash
$ git clone git@github.com:{YOUR_USERNAME}/localmailer.git

$ cd localmailer
```

Once you have this repo cloned to your local system, you will need to install the VSCode extension [Remote Development](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack).

Then run the following command from the command palette:
`Dev Containers: Open Folder in Container...`

This will automatically select the workspace folder. But if you need to find the project manually then it is located at `/workspaces/localmailer`.

#### Development:

Make sure to follow the README files in each of the sub projects to set it up. Once you've done that, move onto the next step.

`Docker compose`:

Spin up a docker compose stack to run all the relevant services needed for development. NOTE: you will need to run this command in the project folder on the host side as docker commands will not work within a docker container. So navigate to this same project folder but within your local system and then run the following commands:

```bash
$ docker compose -f docker-compose.dev.yml down -v && \
  docker compose --env-file=./webapp.env -f docker-compose.dev.yml build --parallel && \
  docker compose --env-file=./webapp.env -f docker-compose.dev.yml up -d
```

Please follow the [Contributing](./CONTRIBUTING.md) guide to set up your environment.

---
