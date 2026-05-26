import { MAIN_BRANCH_NAME } from './versions.constants.mts';
import {
  getJiraIssueId,
  logError,
  isOnMainBranch,
  hasUncommitedChanges,
  gitPullOriginMain,
  gitFetchTags,
  getChangedPackages,
  lernaVersion,
} from './versions.utils.mts';

const main = async () => {
  // Проверка текущей ветки
  if (!(await isOnMainBranch())) {
    logError(`Необходимо находиться на ветке: ${MAIN_BRANCH_NAME}`);
    return;
  }

  // Проверка, что нет изменений не оформленных в коммит
  if (await hasUncommitedChanges()) {
    logError('Присутствуют активные git-изменения. Необходимо сделать коммит');
    return;
  }

  // Обновляем main ветку и теги
  await gitPullOriginMain();
  await gitFetchTags();

  // jiraIssueId для последнего коммита
  const jiraIssueId = await getJiraIssueId();
  if (!jiraIssueId) {
    logError('Не найден jiraIssueId в пространстве RLS');
    return;
  }

  // Нет изменений пакетов
  const changes = await getChangedPackages();
  if (!changes || changes.length === 0) {
    logError('Нет изменений в пакетах для версионирования');
    return;
  }

  // Запускаем lerna version
  await lernaVersion(`chore: publish versions ${jiraIssueId}`);
};

main();
