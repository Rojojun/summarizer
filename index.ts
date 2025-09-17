import {GitlabInfo} from "./GitlabInfo";
import {GitlabMRSummarizer} from "./GitlabMRSummarizer";
import {MR_FINDER_GOODBYE, MR_FINDER_TITLE} from "./Title";
import inquirer from "inquirer";
import chalk from "chalk";

const getGitlabConfig = async () => {
    console.log(chalk.cyan('\n GitLab Configuration'));
    console.log(chalk.gray('Please enter your GitLab information:\n'));

    return inquirer.prompt([
        {
            type: 'input',
            name: 'url',
            message: 'GitLab URL:',
        },
        {
            type: 'input',
            name: 'token',
            message: 'GitLab Personal Access Token:',
        }
    ]);
};

const main = async () => {
    const { url: gitlabUrl, token: gitlabToken } = await getGitlabConfig();

    const info = new GitlabInfo(gitlabUrl, gitlabToken);
    const handler = new GitlabMRSummarizer(info);

    while (true) {
        const selectedProject = await handler.selectProject();

        if (!selectedProject) {
            const { shouldExit } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'shouldExit',
                    message: 'Do you want to exit the application?',
                    default: false,
                },
            ]);

            if (shouldExit) {
                return true;
            }
            continue;
        }

        const selectedMR = await handler.selectMergeRequest(info.accessToken, selectedProject);

        if (!selectedMR) {
            const { action } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: 'What would you like to do?',
                    choices: [
                        {
                            name: chalk.blue('Select another project'),
                            value: 'select_project',
                            short: 'Another project',
                        },
                        {
                            name: chalk.yellow('Try selecting MR again for this project'),
                            value: 'retry_mr',
                            short: 'Retry MR',
                        },
                        {
                            name: chalk.gray('Exit application'),
                            value: 'exit',
                            short: 'Exit',
                        },
                    ],
                },
            ] as any);

            switch (action) {
                case 'select_project':
                    continue;
                case 'retry_mr':
                    const retryMR = await handler.selectMergeRequest(info.accessToken, selectedProject);
                    if (retryMR) {
                        console.log(chalk.green('MR selected successfully!'));
                    }
                    continue;
                case 'exit':
                    return true;
            }
        }

        const { continueApp } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'continueApp',
                message: 'Would you like to select another MR or project?',
                default: true,
            },
        ]);

        if (!continueApp) {
            return true;
        }
    }
}

const runApplication = async () => {
    try {
        MR_FINDER_TITLE();
        await main();
    } catch (error) {
        console.error('Application error:', error);
    } finally {
        MR_FINDER_GOODBYE();
    }
}

process.on('SIGINT', () => {
    console.log('\n');
    MR_FINDER_GOODBYE();
    process.exit(0);
});

process.on('SIGTERM', () => {
    MR_FINDER_GOODBYE();
    process.exit(0);
});

runApplication().then(r => r);
