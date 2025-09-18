import {Summarizer} from "./Summarizer";
import {GitlabInfo} from "./GitlabInfo";
import ora from "ora";
import {Axios, AxiosResponse} from "axios";
import chalk from "chalk";
import {GitLabChanges, GitLabCommit, GitLabMR, GitLabNote, GitLabProject, MRChoice, ProjectChoice} from "./gitlab";
import * as gradient from "gradient-string";
import 'dotenv/config';
import inquirer from "inquirer";

export class GitlabMRSummarizer implements Summarizer {
    private readonly gitlabInfo: GitlabInfo;
    private allProjects: GitLabProject[] = [];
    private readonly pageSize = 10;

    constructor(gitlabInfo: GitlabInfo) {
        this.gitlabInfo = gitlabInfo;
    }

    getProjects = async (): Promise<GitLabProject[]> => {
        const allProjects: GitLabProject[] = [];
        let currentPage = 1;
        let hasMorePages = true;
        const spinner = ora('Search projects...').start();

        console.log(gradient.cristal('strat PR Check'))


        try {
            while (hasMorePages) {
                const response: AxiosResponse = await this.gitlabInfo.client.get('/projects', {
                    params: {
                        membership: true,
                        per_page: 100,
                        order_by: 'last_activity_at',
                        sort: 'desc',
                        page: currentPage,
                    },
                });

                allProjects.push(...response.data);

                const totalPages = parseInt(response.headers['x-total-pages'] || '1');
                const total = parseInt(response.headers['x-total'] || '0');

                spinner.text = `Fetch projects... (${allProjects.length}/${total})`;

                hasMorePages = currentPage < totalPages;
                currentPage++;
            }

            spinner.succeed(chalk.green(`[INFO] found ${allProjects.length} projects`));
            this.allProjects = allProjects;
            return allProjects;
        } catch (e) {
            spinner.fail(chalk.red(`Project search failed`));
            console.error(chalk.red(e));
            throw e;
        }
    };

    createProjectChoices = (projects: GitLabProject[]): ProjectChoice[] => {
        return projects.map(project => {
            const lastActivity = new Date(project.last_activity_at).toLocaleDateString();
            const starCount = project.star_count ? `★ ${project.star_count}` : '';
            const forks = project.forks_count ? `ψ ${project.forks_count}` : '';
            const metrics = [starCount, forks].filter(Boolean).join(' ');

            return {
                name: `${chalk.cyan(project.name_with_namespace)} ${chalk.gray(`(${lastActivity})`)} ${chalk.yellow(metrics)}`,
                value: project,
                short: project.name,
            };
        });
    }

    searchProjects = async (): Promise<GitLabProject[]> => {
        console.log('\n' + chalk.blue('Search Projects'));
        console.log(chalk.gray('─'.repeat(50)));

        const { searchTerm } = await inquirer.prompt([
            {
                type: 'input',
                name: 'searchTerm',
                message: 'Enter search term:',
                prefix: chalk.blue('[SEARCH]'),
                suffix: chalk.gray(' (project name, namespace, or description)'),
                validate: (input: string) => {
                    if (input.trim().length === 0) {
                        return 'Search term cannot be empty';
                    }
                    if (input.trim().length < 2) {
                        return 'Search term must be at least 2 characters';
                    }
                    return true;
                },
                filter: (input: string) => input.trim(),
                theme: {
                    style: {
                        answer: chalk.cyan,
                        message: chalk.blue,
                        help: chalk.gray,
                        error: chalk.red,
                    },
                },
            },
        ] as any);

        const spinner = ora(`Searching for "${searchTerm}"...`).start();

        const filtered = this.allProjects.filter(project =>
            project.name_with_namespace.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        spinner.succeed(chalk.green(`[SEARCH] Found ${filtered.length} projects matching "${searchTerm}"`));
        return filtered;
    }

    showProjectPage = async (projects: GitLabProject[], currentPage: number = 1, searchTerm?: string): Promise<GitLabProject | null> => {
        const totalPages = Math.ceil(projects.length / this.pageSize);
        const startIndex = (currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const currentProjects = projects.slice(startIndex, endIndex);

        if (currentProjects.length === 0) {
            console.log(chalk.yellow("No projects found on this page"));
            return null;
        }

        // 페이지 헤더
        console.log('');
        if (searchTerm) {
            console.log(chalk.blue(`Search Results for "${searchTerm}" - Page ${currentPage}/${totalPages} (${projects.length} total)`));
        } else {
            console.log(chalk.blue(`Project List - Page ${currentPage}/${totalPages} (${projects.length} total)`));
        }
        console.log(chalk.gray('─'.repeat(80)));

        const choices = this.createProjectChoices(currentProjects);

        const navigationChoices = [];


        // navigationChoices.push({type: 'separator', line: chalk.gray('─'.repeat(60))});
        navigationChoices.push(new inquirer.Separator());

        if (currentPage > 1) {
            navigationChoices.push({
                name: chalk.blue(`Previous Page (${currentPage - 1}/${totalPages})`),
                value: 'prev_page',
                short: 'Previous',
            });
        }

        if (currentPage < totalPages) {
            navigationChoices.push({
                name: chalk.blue(`Next Page (${currentPage + 1}/${totalPages})`),
                value: 'next_page',
                short: 'Next',
            });
        }

        if (totalPages > 2) {
            navigationChoices.push({
                name: chalk.cyan(`Go to specific page (1-${totalPages})`),
                value: 'goto_page',
                short: 'Go to page',
            });
        }

        navigationChoices.push({
            name: chalk.green('Search projects'),
            value: 'search',
            short: 'Search',
        });

        navigationChoices.push({
            name: chalk.yellow('Refresh project list'),
            value: 'refresh',
            short: 'Refresh',
        });

        if (searchTerm) {
            navigationChoices.push({
                name: chalk.magenta('Back to all projects'),
                value: 'back_to_all',
                short: 'Back to all',
            });
        }

        navigationChoices.push({
            name: chalk.gray('Cancel'),
            value: 'cancel',
            short: 'Cancel',
        });

        const { selectedProject } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedProject',
                message: 'Select a project or choose an option:',
                choices: [...choices, ...navigationChoices],
                pageSize: 15,
                loop: false,
                theme: {
                    icon: {
                        cursor: '',
                    },
                    style: {
                        highlight: (text: string) => chalk.bgMagenta.white(` ${text} `),
                        answer: chalk.magenta.bold,
                        message: chalk.blue.bold,
                    },
                }
            },
        ] as any);

        switch (selectedProject) {
            case 'prev_page':
                return this.showProjectPage(projects, currentPage - 1, searchTerm);

            case 'next_page':
                return this.showProjectPage(projects, currentPage + 1, searchTerm);

            case 'goto_page':
                console.log('\n' + chalk.cyan('Go to Page'));
                console.log(chalk.gray('─'.repeat(30)));

                const { targetPage } = await inquirer.prompt([
                    {
                        type: 'number',
                        name: 'targetPage',
                        message: `Enter page number (1-${totalPages}):`,
                        prefix: chalk.cyan('[PAGE]'),
                        validate: (input: number) => {
                            if (input >= 1 && input <= totalPages) {
                                return true;
                            }
                            return `Page number must be between 1 and ${totalPages}`;
                        },
                        theme: {
                            style: {
                                answer: chalk.cyan,
                                message: chalk.blue,
                                error: chalk.red,
                            },
                        },
                    },
                ] as any);
                return this.showProjectPage(projects, targetPage, searchTerm);

            case 'search':
                try {
                    const searchResults = await this.searchProjects();
                    if (searchResults.length === 0) {
                        console.log(chalk.yellow('[SEARCH] No results found. Returning to project list.'));
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        return this.showProjectPage(projects, currentPage, searchTerm);
                    }
                    return this.showProjectPage(searchResults, 1, searchTerm);
                } catch (error) {
                    console.log(chalk.red('[ERROR] Search failed. Returning to project list.'));
                    return this.showProjectPage(projects, currentPage, searchTerm);
                }

            case 'refresh':
                const spinner = ora('Refreshing project list...').start();
                try {
                    const refreshedProjects = await this.getProjects();
                    spinner.succeed(chalk.green('[REFRESH] Project list updated'));
                    return this.showProjectPage(refreshedProjects, 1);
                } catch (error) {
                    spinner.fail(chalk.red('[REFRESH] Failed to refresh. Using cached data.'));
                    return this.showProjectPage(projects, currentPage, searchTerm);
                }

            case 'back_to_all':
                return this.showProjectPage(this.allProjects, 1);

            case 'cancel':
                console.log(chalk.red('취소 하였습니다. CLI를 종료합니다.'));
                return null;

            default:
                if (selectedProject && typeof selectedProject === 'object') {
                    return selectedProject;
                }
                return null;
        }
    }

    selectProject = async (): Promise<GitLabProject | null> => {
        let projects = this.allProjects;
        if (projects.length === 0) {
            projects = await this.getProjects();
        }

        if (projects.length === 0) {
            console.log(chalk.yellow("No projects found."));
            return null;
        }

        const selectedProject = await this.showProjectPage(projects, 1);

        if (selectedProject && typeof selectedProject === 'object') {
            console.log(chalk.green('\n[INFO] 선택된 프로젝트:'));
            console.log(chalk.cyan(`   ${selectedProject.name_with_namespace}`));
            console.log(chalk.gray(`   ID: ${selectedProject.id}`));
            if (selectedProject.description) {
                console.log(chalk.gray(`   ${selectedProject.description}`));
            }
            console.log(chalk.gray(`   최근 활동: ${new Date(selectedProject.last_activity_at).toLocaleString()}`));

            if (selectedProject.star_count) {
                console.log(chalk.yellow(`   Stars: ${selectedProject.star_count}`));
            }
            if (selectedProject.forks_count) {
                console.log(chalk.yellow(`   Forks: ${selectedProject.forks_count}`));
            }
            console.log('');
            return selectedProject;
        }

        return null;
    }

    selectMRStatus = async (): Promise<string | null> => {
        console.log('\n' + chalk.blue('Select Merge Request Status'));
        console.log(chalk.gray('─'.repeat(50)));

        const statusChoices = [
            {
                name: `${chalk.green('Opened')} - Active merge requests`,
                value: 'opened',
                short: 'Opened',
            },
            {
                name: `${chalk.red('Closed')} - Closed without merging`,
                value: 'closed',
                short: 'Closed',
            },
            {
                name: `${chalk.blue('Merged')} - Successfully merged`,
                value: 'merged',
                short: 'Merged',
            },
            {
                name: `${chalk.yellow('All')} - All merge requests`,
                value: 'all',
                short: 'All',
            },
            {
                name: chalk.gray('Cancel'),
                value: 'cancel',
                short: 'Cancel',
            },
        ];

        const { selectedStatus } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedStatus',
                message: 'Which merge requests would you like to view?',
                choices: statusChoices,
                theme: {
                    icon: {
                        cursor: '',
                    },
                    style: {
                        highlight: (text: string) => chalk.bgBlue.white(` ${text} `),
                        answer: chalk.blue.bold,
                        message: chalk.cyan.bold,
                    },
                }
            },
        ] as any);

        if (selectedStatus === 'cancel') {
            return null;
        }

        return selectedStatus;
    };

    getMergeRequests = async (projectId: number, status: string): Promise<GitLabMR[]> => {
        const allMRs: GitLabMR[] = [];
        let currentPage = 1;
        let hasMorePages = true;

        const statusText = status === 'all' ? 'all merge requests' : `${status} merge requests`;
        const spinner = ora(`Fetching ${statusText}...`).start();

        try {
            while (hasMorePages) {
                const params: any = {
                    per_page: 100,
                    page: currentPage,
                    order_by: 'updated_at',
                    sort: 'desc',
                };

                if (status !== 'all') {
                    params.state = status;
                }

                const response: AxiosResponse<GitLabMR[]> = await this.gitlabInfo.client.get(
                    `/projects/${projectId}/merge_requests`,
                    { params }
                );

                allMRs.push(...response.data);

                const totalPages = parseInt(response.headers['x-total-pages'] || '1');
                const total = parseInt(response.headers['x-total'] || '0');

                spinner.text = `Fetching ${statusText}... (${allMRs.length}/${total})`;

                hasMorePages = currentPage < totalPages;
                currentPage++;
            }

            spinner.succeed(chalk.green(`[INFO] found ${allMRs.length} ${statusText}`));
            return allMRs;

        } catch (error) {
            spinner.fail(chalk.red(`Failed to fetch merge requests`));
            console.error(chalk.red(error));
            throw error;
        }
    };

    createMRChoices = (mrs: GitLabMR[]): MRChoice[] => {
        return mrs
            .filter(mr => mr && mr.title)
            .map(mr => {
                const updatedDate = new Date(mr.updated_at).toLocaleDateString();
                const author = mr.author ? mr.author.name : 'Unknown';

                let statusColor;
                let statusIcon;

                switch (mr.state) {
                    case 'opened':
                        statusColor = chalk.green;
                        statusIcon = '●';
                        break;
                    case 'merged':
                        statusColor = chalk.blue;
                        statusIcon = '✓';
                        break;
                    case 'closed':
                        statusColor = chalk.red;
                        statusIcon = '✗';
                        break;
                    default:
                        statusColor = chalk.gray;
                        statusIcon = '○';
                }

                const comments = mr.user_notes_count ? `💬 ${mr.user_notes_count}` : '';
                const votes = mr.upvotes ? `👍 ${mr.upvotes}` : '';
                const extras = [comments, votes].filter(Boolean).join(' ');

                return {
                    name: `${statusColor(statusIcon)} ${chalk.cyan(`!${mr.iid}`)} ${chalk.white(mr.title)} ${chalk.gray(`by ${author} (${updatedDate})`)} ${chalk.yellow(extras)}`,
                    value: mr,
                    short: `!${mr.iid} ${mr.title}`,
                };
            });
    };

    showMRPage = async (mrs: GitLabMR[], currentPage: number = 1, project: GitLabProject, status: string): Promise<GitLabMR | string | null> => {
        const totalPages = Math.ceil(mrs.length / this.pageSize);
        const startIndex = (currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const currentMRs = mrs.slice(startIndex, endIndex);

        if (currentMRs.length === 0) {
            console.log(chalk.yellow("No merge requests found on this page"));
            return null;
        }

        console.log('');
        const statusText = status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1);
        console.log(chalk.blue(`${statusText} Merge Requests - ${project.name_with_namespace}`));
        console.log(chalk.blue(`Page ${currentPage}/${totalPages} (${mrs.length} total)`));
        console.log(chalk.gray('─'.repeat(80)));

        const choices = this.createMRChoices(currentMRs);

        // 네비게이션 옵션
        // const createSeparator = (text: string = '') => ({
        //     name: chalk.gray(text || '─'.repeat(60)),
        //     short: 'value',
        //     value: '__separator__',
        //     disabled: true,
        // });

        const navigationChoices: any[] = [
            new inquirer.Separator('─ Navigation ─')
            // createSeparator('─ Navigation ─')
        ];

        if (currentPage > 1) {
            navigationChoices.push({
                name: chalk.blue('◀ Previous Page'),
                short: 'Previous',
                value: 'prev_page',
            });
        }

        if (currentPage < totalPages) {
            navigationChoices.push({
                name: chalk.blue('Next Page ▶'),
                short: 'Next',
                value: 'next_page',
            });
        }

        navigationChoices.push({
            name: chalk.green('Change status filter'),
            short: 'Change Status',
            value: 'change_status',
        });

        navigationChoices.push({
            name: chalk.yellow('Refresh MR list'),
            short: 'Refresh',
            value: 'refresh',
        });

        navigationChoices.push({
            name: chalk.magenta('Back to project selection'),
            short: 'Back',
            value: 'back_to_projects',
        });

        navigationChoices.push({
            name: chalk.gray('Cancel'),
            value: 'cancel',
        });

        const { selectedMR } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedMR',
                message: 'Select a merge request or choose an option:',
                choices: [...choices, ...navigationChoices],
                pageSize: 15,
                loop: false,
                theme: {
                    icon: {
                        cursor: '',
                    },
                    style: {
                        highlight: (text: string) => chalk.bgMagenta.white(` ${text} `),
                        answer: chalk.magenta.bold,
                        message: chalk.blue.bold,
                    },
                }
            },
        ] as any);

        if (selectedMR === '__separator__') {
            return this.showMRPage(mrs, currentPage, project, status);
        }

        return selectedMR;
    };

    selectMergeRequest = async (client: string, project: GitLabProject): Promise<GitLabMR | null> => {
        console.log(chalk.green(`\n[INFO] Selected Project: ${project.name_with_namespace}`));

        let currentPage = 1;
        let selectedStatus = await this.selectMRStatus();

        if (!selectedStatus) {
            return null;
        }

        let mrs = await this.getMergeRequests(project.id, selectedStatus);

        if (mrs.length === 0) {
            const statusText = selectedStatus === 'all' ? 'merge requests' : `${selectedStatus} merge requests`;
            console.log(chalk.yellow(`No ${statusText} found in this project.`));

            const { tryAgain } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'tryAgain',
                    message: 'Would you like to try a different status?',
                    default: true,
                },
            ]);

            if (tryAgain) {
                return this.selectMergeRequest(client, project);
            }
            return null;
        }

        while (true) {
            const result = await this.showMRPage(mrs, currentPage, project, selectedStatus);

            if (result && typeof result === 'object') {
                console.log(chalk.green('\n[INFO] Selected Merge Request:'));
                console.log(chalk.cyan(`   !${result.iid} ${result.title}`));
                console.log(chalk.gray(`   Author: ${result.author.name} (@${result.author.username})`));
                console.log(chalk.gray(`   Status: ${result.state}`));
                console.log(chalk.gray(`   Source: ${result.source_branch} → ${result.target_branch}`));
                console.log(chalk.gray(`   Created: ${new Date(result.created_at).toLocaleString()}`));
                console.log(chalk.gray(`   Updated: ${new Date(result.updated_at).toLocaleString()}`));
                if (result.description) {
                    console.log(chalk.gray(`   Description: ${result.description.substring(0, 100)}...`));
                }
                console.log(chalk.blue(`   URL: ${result.web_url}`));

                const { showDetails } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'showDetails',
                        message: 'Would you like to see detailed information (commits, changes, reviews)?',
                        default: true,
                    },
                ]);

                if (showDetails) {
                    await this.showMRDetails(client, result, project);
                }

                console.log('');
                return result;
            }

            // 액션 처리
            const action = result as string;
            const totalPages = Math.ceil(mrs.length / this.pageSize);

            switch (action) {
                case 'prev_page':
                    currentPage = Math.max(1, currentPage - 1);
                    break;

                case 'next_page':
                    currentPage = Math.min(totalPages, currentPage + 1);
                    break;

                case 'change_status':
                    selectedStatus = await this.selectMRStatus();
                    if (!selectedStatus) {
                        return null;
                    }
                    mrs = await this.getMergeRequests(project.id, selectedStatus);
                    currentPage = 1;
                    break;

                case 'refresh':
                    mrs = await this.getMergeRequests(project.id, selectedStatus);
                    currentPage = 1;
                    break;

                case 'back_to_projects':
                    return null;

                case 'cancel':
                    return null;

                default:
                    break;
            }
        }
    };

    getMRCommits = async (projectId: number, mrIid: number): Promise<GitLabCommit[]> => {
        const spinner = ora('Fetching MR commits...').start();

        try {
            const response: AxiosResponse<GitLabCommit[]> = await this.gitlabInfo.client.get(
                `/projects/${projectId}/merge_requests/${mrIid}/commits`
            );

            spinner.succeed(chalk.green(`[INFO] found ${response.data.length} commits`));
            return response.data;
        } catch (error) {
            spinner.fail(chalk.red('Failed to fetch commits'));
            console.error(chalk.red(error));
            return [];
        }
    };

    getMRChanges = async (projectId: number, mrIid: number): Promise<GitLabChanges[]> => {
        const spinner = ora('Fetching MR changes...').start();

        try {
            const response: AxiosResponse<{ changes: GitLabChanges[] }> = await this.gitlabInfo.client.get(
                `/projects/${projectId}/merge_requests/${mrIid}/changes`
            );

            spinner.succeed(chalk.green(`[INFO] found ${response.data.changes.length} file changes`));
            return response.data.changes;
        } catch (error) {
            spinner.fail(chalk.red('Failed to fetch changes'));
            console.error(chalk.red(error));
            return [];
        }
    };

    getMRNotes = async (projectId: number, mrIid: number): Promise<GitLabNote[]> => {
        const spinner = ora('Fetching MR reviews and comments...').start();

        try {
            const response: AxiosResponse<GitLabNote[]> = await this.gitlabInfo.client.get(
                `/projects/${projectId}/merge_requests/${mrIid}/notes`,
                {
                    params: {
                        per_page: 100,
                        order_by: 'created_at',
                        sort: 'desc',
                    }
                }
            );

            const userNotes = response.data.filter(note => !note.system);
            spinner.succeed(chalk.green(`[INFO] found ${userNotes.length} comments/reviews`));
            return userNotes;
        } catch (error) {
            spinner.fail(chalk.red('Failed to fetch notes'));
            console.error(chalk.red(error));
            return [];
        }
    };

    displayCommits = (commits: GitLabCommit[]): void => {
        console.log(chalk.blue('\n=== Commit History ==='));
        console.log(chalk.gray('─'.repeat(80)));

        if (commits.length === 0) {
            console.log(chalk.yellow('No commits found'));
            return;
        }

        commits.forEach((commit, index) => {
            const date = new Date(commit.authored_date).toLocaleDateString();
            console.log(`${chalk.cyan(`${index + 1}.`)} ${chalk.white(commit.title)}`);
            console.log(`   ${chalk.gray(`${commit.short_id} by ${commit.author_name} (${date})`)}`);

            if (commit.message !== commit.title) {
                const description = commit.message.replace(commit.title, '').trim();
                if (description) {
                    console.log(`   ${chalk.dim(description.substring(0, 100))}${description.length > 100 ? '...' : ''}`);
                }
            }
            console.log('');
        });
    };

    displayChanges = (changes: GitLabChanges[]): void => {
        console.log(chalk.blue('\n=== File Changes Summary ==='));
        console.log(chalk.gray('─'.repeat(80)));

        if (changes.length === 0) {
            console.log(chalk.yellow('No file changes found'));
            return;
        }

        const stats = {
            added: changes.filter(c => c.new_file).length,
            modified: changes.filter(c => !c.new_file && !c.deleted_file && !c.renamed_file).length,
            deleted: changes.filter(c => c.deleted_file).length,
            renamed: changes.filter(c => c.renamed_file).length,
        };

        console.log(`${chalk.green(`+${stats.added} added`)} ${chalk.yellow(`~${stats.modified} modified`)} ${chalk.red(`-${stats.deleted} deleted`)} ${chalk.blue(`→${stats.renamed} renamed`)}`);
        console.log('');

        changes.slice(0, 20).forEach((change, index) => {
            let statusIcon = '';
            let statusColor = chalk.gray;

            if (change.new_file) {
                statusIcon = '+';
                statusColor = chalk.green;
            } else if (change.deleted_file) {
                statusIcon = '-';
                statusColor = chalk.red;
            } else if (change.renamed_file) {
                statusIcon = '→';
                statusColor = chalk.blue;
            } else {
                statusIcon = '~';
                statusColor = chalk.yellow;
            }

            const filePath = change.renamed_file ? `${change.old_path} → ${change.new_path}` : change.new_path;
            console.log(`${statusColor(statusIcon)} ${statusColor(filePath)}`);
        });

        if (changes.length > 20) {
            console.log(chalk.gray(`... and ${changes.length - 20} more files`));
        }
    };

    displayReviews = (notes: GitLabNote[]): void => {
        console.log(chalk.blue('\n=== Code Reviews & Comments ==='));
        console.log(chalk.gray('─'.repeat(80)));

        if (notes.length === 0) {
            console.log(chalk.yellow('No reviews or comments found'));
            return;
        }

        notes.slice(0, 10).forEach((note, index) => {
            const date = new Date(note.created_at).toLocaleDateString();
            console.log(`${chalk.cyan(`${index + 1}.`)} ${chalk.white(note.author.name)} ${chalk.gray(`(@${note.author.username}) - ${date}`)}`);

            const body = note.body.replace(/\n/g, ' ').substring(0, 200);
            console.log(`   ${chalk.gray(body)}${note.body.length > 200 ? '...' : ''}`);
            console.log('');
        });

        if (notes.length > 10) {
            console.log(chalk.gray(`... and ${notes.length - 10} more comments`));
        }
    };

    showMRDetails = async (client: string, mr: GitLabMR, project: GitLabProject): Promise<void> => {
        console.log(chalk.green(`\n[DETAILED INFO] MR !${mr.iid} - ${mr.title}`));
        console.log(chalk.gray('='.repeat(80)));

        const { detailChoice } = await inquirer.prompt([
            {
                type: 'list',
                name: 'detailChoice',
                message: 'What detailed information would you like to see?',
                choices: [
                    {
                        name: chalk.magenta('AI Research Analysis (Gemini)'),
                        value: 'ai_analysis',
                        short: 'AI Analysis',
                    },
                    {
                        name: chalk.blue('All information (commits + changes + reviews)'),
                        value: 'all',
                        short: 'All',
                    },
                    {
                        name: chalk.green('Commit history'),
                        value: 'commits',
                        short: 'Commits',
                    },
                    {
                        name: chalk.yellow('File changes'),
                        value: 'changes',
                        short: 'Changes',
                    },
                    {
                        name: chalk.cyan('Code reviews & comments'),
                        value: 'reviews',
                        short: 'Reviews',
                    },
                    {
                        name: chalk.gray('Skip details'),
                        value: 'skip',
                        short: 'Skip',
                    },
                ],
                theme: {
                    icon: { cursor: '' },
                    style: {
                        highlight: (text: string) => chalk.bgMagenta.white(` ${text} `),
                        answer: chalk.magenta.bold,
                        message: chalk.cyan.bold,
                    },
                }
            },
        ] as any);

        if (detailChoice === 'skip') {
            return;
        }

        if (detailChoice === 'ai_analysis') {
            await this.generateMRAnalysis(client, mr, project);
            return;
        }

        // 기존 상세 정보 표시 로직...
        if (detailChoice === 'all' || detailChoice === 'commits') {
            const commits = await this.getMRCommits(project.id, mr.iid);
            this.displayCommits(commits);
        }

        if (detailChoice === 'all' || detailChoice === 'changes') {
            const changes = await this.getMRChanges(project.id, mr.iid);
            this.displayChanges(changes);
        }

        if (detailChoice === 'all' || detailChoice === 'reviews') {
            const notes = await this.getMRNotes(project.id, mr.iid);
            this.displayReviews(notes);
        }

        console.log(chalk.blue('\n[INFO] Detailed information display complete'));
    };

    private callGeminiAPI = async (client: string, mr: GitLabMR, project: GitLabProject, commit: GitLabCommit[], changes: GitLabChanges[], notes: GitLabNote[]): Promise<string> => {
        const response: AxiosResponse = await this.gitlabInfo.client.post(`${process.env.GEMINI_QUEUE_SERVER_API}/request`,{
                userID: client,
                payload: mr.iid.toString(),
                gitLabMR: mr,
                gitLabProject: project,
                gitLabCommits: commit,
                gitLabChanges: changes,
                gitLabNotes: notes,
            }
        );

        if (response.status < 200 || response.status >= 300) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        return response.data;
    };

    generateMRAnalysis = async (client: string, mr: GitLabMR, project: GitLabProject): Promise<void> => {
        console.log(chalk.blue('\n=== AI-Powered MR Analysis ==='));
        console.log(chalk.gray('Collecting comprehensive MR data...'));

        const spinner = ora('Fetching all MR information...').start();

        try {
            const [commits, changes, notes] = await Promise.all([
                this.getMRCommits(project.id, mr.iid),
                this.getMRChanges(project.id, mr.iid),
                this.getMRNotes(project.id, mr.iid),
            ]);

            spinner.text = 'Preparing data for AI analysis...';
            spinner.text = 'Generating analysis with Gemini AI...';

            const analysis = await this.callGeminiAPI(client, mr, project, commits, changes, notes);

            spinner.succeed(chalk.green('AI analysis completed!'));

            this.displayAnalysisResult(analysis, mr);

        } catch (error: unknown | any) {
            spinner.fail(chalk.red('Failed to generate AI analysis'));

            if (error.message.includes('GEMINI_API_KEY')) {
                console.log(chalk.yellow('\n[SETUP] Gemini API key is required'));
                console.log(chalk.gray('1. Get API key from: https://makersuite.google.com/app/apikey'));
                console.log(chalk.gray('2. Create .env file in project root'));
                console.log(chalk.gray('3. Add: GEMINI_API_KEY=your_api_key_here'));
            } else {
                console.error(chalk.red(`Error: ${error.message}`));
            }
        }
    };

    private displayAnalysisResult = (analysis: string, mr: GitLabMR): void => {
        console.log(chalk.blue('\n' + '='.repeat(80)));
        console.log(chalk.blue.bold(`   AI ANALYSIS: !${mr.iid} ${mr.title}`));
        console.log(chalk.blue('='.repeat(80)));
        console.log('');
        console.log(analysis);
        console.log('');
        console.log(chalk.gray('─'.repeat(80)));
        console.log(chalk.gray('Generated by Gemini AI'));
    };
}