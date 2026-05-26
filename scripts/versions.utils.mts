import { execa } from 'execa';
// import type { PackageChangeItem } from './versions.types.mts';
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
  // TODO: нужно ли к консоль направлять вывод?
  const promise = execa`git pull origin ${MAIN_BRANCH_NAME}`;
  // Направляем вывод git в консоль
  promise.stdout.pipe(process.stdout);
  promise.stderr.pipe(process.stderr);
  await promise;
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
  // --no-git-tag-version
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
  // const { stdout } = await promise;
  // return extractChanges(stdout);
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
    // TODO: оставить или убрать --conventional-graduate ?
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
    console.log(stdout);
  } catch {
    return undefined;
  }
};

// stdout - вывод lerna с флагом --json
// https://github.com/lerna/lerna/tree/main/libs/commands/version#--json
// export const extractChanges = (stdout: string) => {
//   try {
//     const result = JSON.parse(stdout);
//     if (Array.isArray(result)) {
//       return result as PackageChangeItem[];
//     }
//   } catch {}
//   return undefined;
// };

// TODO: нужен ли нам ручной тег?
// v1.2.0
// export const createTagName = (changes: PackageChangeItem[]) => {
//   // TODO: если нужен ручной тег - доработать - кидать ошибку если нет изменений
//   return 'v' + changes[0].newVersion;
// };

// // TODO: нужен ли нам ручной коммит?
// export const createCommitDescription = (changes: PackageChangeItem[]) => {
//   const commitDescription = changes.map((el) => ` - ${el.name}@${el.newVersion}`).join('\n');
//   return commitDescription;
// };

// export const gitCreateCommit = async (params: { title: string; description: string }) => {
//   const { title, description } = params;
//   await execa`git add .`;

//   const promise = execa`git commit -m ${title} -m ${description}`;
//   promise.stdout.pipe(process.stdout);
//   promise.stderr.pipe(process.stderr);
//   await promise;
//   logSuccess(`Создан коммит: ${title}`);
// };

// export const gitCreateTag = async (tagName: string) => {
//   const promise = execa`git tag -a ${tagName} -m ${tagName}`;
//   promise.stdout.pipe(process.stdout);
//   promise.stderr.pipe(process.stderr);
//   await promise;
//   logSuccess(`Создан тег: ${tagName}`);
// };

// export const gitPush = async (tagName: string) => {
//   // --atomic - отправляем вместе (или всё или ничего) коммит и тег
//   // страхуемся от пуша коммит без тега или тега без коммита
//   const promise = execa`git push --atomic origin ${MAIN_BRANCH_NAME} ${tagName}`;
//   promise.stdout.pipe(process.stdout);
//   promise.stderr.pipe(process.stderr);
//   await promise;
//   logSuccess(`Изменения отправлены в удаленный репозиторий, ветка: ${MAIN_BRANCH_NAME}`);
// };
