import { POSITIVE_INTEGER_REGEX } from '@app/utils/constant';
import intl from 'react-intl-universal';

export const hostRulesFn = () => [
  {
    required: true,
    message: intl.get('formRules.hostRequired'),
  },
];

export const usernameRulesFn = () => [
  {
    required: true,
    message: intl.get('formRules.usernameRequired'),
  },
];

export const passwordRulesFn = () => [
  {
    required: true,
    message: intl.get('formRules.passwordRequired'),
  },
];

export const nameRulesFn = () => [
  {
    required: true,
    message: intl.get('formRules.nameRequired'),
  },
];

export const numberRulesFn = () => [
  {
    pattern: POSITIVE_INTEGER_REGEX,
    message: intl.get('formRules.numberRequired'),
  },
];

export const replicaRulesFn = (activeMachineNum) => [
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
