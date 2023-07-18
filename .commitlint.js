export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      // commit message format:
      // [feat|fix|docs|refactor|test|chore|revert]: your message
      [
        'feat', // add function (添加功能)
        'mod', // modify changes (修改)
        'fix', // fix bugs
        'docs', // docs modify
        'refactor', // refactor (重构)
        'test', // test (测试)
        'chore', // other things like scaffold, ci/cd (其他诸如构建部署等修改)
        'revert', // revert commit
      ],
    ],
    'subject-full-stop': [0, 'never'],
    'subject-case': [0, 'never'],
  },
};
