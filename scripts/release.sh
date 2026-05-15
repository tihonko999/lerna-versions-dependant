# скрипт по последнему коммиту получает jira_issue_id
# при отсутствии jira_issue_id скрипт прерывается
# запускается lerna version:
# поднимаются версии измененных пакетов, создается коммит, создаются git теги для каждого поднятого пакета, выполняетя пуш в gitlab

export jira_issue_id=$(grep -o -E "(RLS+-[0-9]+)" <<< $(git log -1 --oneline))

if [ -z "$jira_issue_id" ]; then
  echo 'No jira issue id found';
  exit;
fi

yarn lerna version --message "chore: publish versions $jira_issue_id"
