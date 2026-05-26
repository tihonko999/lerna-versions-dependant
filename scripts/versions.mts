import {
  createTagName,
  getJiraIssueId,
  logError,
  isOnMainBranch,
  hasUncommitedChanges,
  createCommitDescription,
  gitPullOriginMain,
  gitFetchTags,
  gitCreateCommit,
  gitCreateTag,
  gitPush,
  lernaVersion,
} from './versions.utils.mts';
import { MAIN_BRANCH_NAME } from './versions.constants.mts';

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

  // Запускаем lerna version
  const changes = await lernaVersion();

  // Нет изменений пакетов
  if (!changes || changes.length === 0) {
    logError('Нет изменений в пакетах для версионирования');
    return;
  }

  // Есть изменения
  const tagName = createTagName(changes);
  const commitTitle = `chore: publish versions ${jiraIssueId}`;
  const commitDescription = createCommitDescription(changes);

  // Делаем коммит
  await gitCreateCommit({ title: commitTitle, description: commitDescription });

  // Создаем один тег с именами всех пакетов и их новых версий
  await gitCreateTag(tagName);

  // Публикуем коммит и тег вместе за одну транзакцию - всё или ничего
  await gitPush(tagName);
};

main();
