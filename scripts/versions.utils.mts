import { execa } from 'execa';
import { MAIN_BRANCH_NAME, COLOR_SYMBOLS } from './versions.constants.mts';

export const getJiraIssueId = async () => {
  const regEx = /RLS+-[0-9]+/;
  const { stdout } = await execa`git log -1 --oneline`;
  const result = stdout.match(regEx);
  return result?.[0];
};

export const isOnMainBranch = async () => {
  const { stdout } = await execa`git branch --show-current`;
  return stdout === MAIN_BRANCH_NAME;
};

export const hasUncommitedChanges = async () => {
  const { stdout } = await execa`git status --porcelain`;
  return Boolean(stdout.trim());
};

export const gitPullOriginMain = async () => {
  logInfo(`Обновляем ветку ${MAIN_BRANCH_NAME}`);
  await execa`git pull origin ${MAIN_BRANCH_NAME}`;
  logSuccess(`Обновили ветку ${MAIN_BRANCH_NAME}`);
};

export const gitFetchTags = async () => {
  logInfo('Обновляем теги');
  // Удаляем все локальные теги
  await execa(`git tag -d $(git tag -l)`, { shell: true });
  // Подтягиваем все удаленные теги
  await execa`git fetch --tags --quiet`;
  logSuccess('Обновили теги');
};

export const lernaVersion = async (commitMessage: string) => {
  const promise = execa`
    yarn lerna version
      --conventional-commits
      --conventional-graduate
      --include-merged-tags
      --yes
      --json
      --allow-branch ${MAIN_BRANCH_NAME}
      --message ${commitMessage}
      `;
  // Направляем вывод lerna в консоль
  promise.stdout.pipe(process.stdout);
  promise.stderr.pipe(process.stderr);

  await promise;
};

export const logError = (msg: string) => {
  console.log(`${COLOR_SYMBOLS.FgRed}%s${COLOR_SYMBOLS.Reset}`, msg);
};

export const logSuccess = (msg: string) => {
  console.log(`${COLOR_SYMBOLS.FgGreen}%s${COLOR_SYMBOLS.Reset}`, msg);
};

export const logInfo = (msg: string) => {
  console.log(`${COLOR_SYMBOLS.FgBlue}%s${COLOR_SYMBOLS.Reset}`, msg);
};

export const getChangedPackages = async () => {
  try {
    const { stdout } = await execa`
      yarn lerna changed
        --json
        --all
        --include-merged-tags
        --conventional-graduate
      `;
    const result = JSON.parse(stdout);
    if (Array.isArray(result)) {
      return result as { name: string }[];
    }
    return undefined;
  } catch {
    return undefined;
  }
};
