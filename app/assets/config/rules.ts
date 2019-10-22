export const hostRulesFn = (intl) => [
  {
    required: true,
    message: intl.get('formRules.hostRequired'),
  },
];

export const usernameRulesFn = (intl) => [
  {
    required: true,
    message: intl.get('formRules.usernameRequired'),
  },
];

export const passwordRulesFn = (intl) => [
  {
    required: true,
    message: intl.get('formRules.passwordRequired'),
  },
];
