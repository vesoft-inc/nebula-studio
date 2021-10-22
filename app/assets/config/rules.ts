import { NAME_REGEX, POSITIVE_INTEGER_REGEX } from '#assets/utils/constant';

export const hostRulesFn = intl => [
  {
    required: true,
    message: intl.get('formRules.hostRequired'),
  },
];

export const usernameRulesFn = intl => [
  {
    required: true,
    message: intl.get('formRules.usernameRequired'),
  },
];

export const passwordRulesFn = intl => [
  {
    required: true,
    message: intl.get('formRules.passwordRequired'),
  },
];

export const nodeIdRulesFn = intl => [
  {
    required: true,
    message: intl.get('formRules.idRequired'),
  },
  {
    pattern: /^(.+)*(\n.+)*(\n)*$/,
    message: intl.get('formRules.nodeIdError'),
  },
];

export const nameRulesFn = intl => [
  {
    required: true,
    message: intl.get('formRules.nameRequired'),
  },
  {
    pattern: NAME_REGEX,
    message: intl.get('formRules.nameValidate'),
  },
];

export const numberRulesFn = intl => [
  {
    pattern: POSITIVE_INTEGER_REGEX,
    message: intl.get('formRules.numberRequired'),
  },
];

export const replicaRulesFn = (intl, activeMachineNum) => [
  {
    pattern: POSITIVE_INTEGER_REGEX,
    message: intl.get('formRules.numberRequired'),
  },
  {
    validator(_rule, value, callback) {
      if (value && Number(value) > activeMachineNum) {
        callback(
          intl.get('formRules.replicaLimit', { number: activeMachineNum }),
        );
      }
      callback();
    },
  },
];
