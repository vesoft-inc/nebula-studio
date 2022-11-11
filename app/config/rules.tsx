import React from 'react';
import { Translation } from '@vesoft-inc/i18n';
import { MAX_COMMENT_BYTES, POSITIVE_INTEGER_REGEX } from '@app/utils/constant';
import { getByteLength } from '@app/utils/function';

export const hostRulesFn = () => [
  {
    required: true,
    message: <Translation>
      {intl => intl.get('formRules.hostRequired')}
    </Translation>,
  },
];

export const usernameRulesFn = () => [
  {
    required: true,
    message: <Translation>
      {intl => intl.get('formRules.usernameRequired')}
    </Translation>,
  },
];

export const passwordRulesFn = () => [
  {
    required: true,
    message: <Translation>
      {intl => intl.get('formRules.passwordRequired')}
    </Translation>,
  },
];

export const nameRulesFn = () => [
  {
    required: true,
    message: <Translation>
      {intl => intl.get('formRules.nameRequired')}
    </Translation>,
  }
];

export const numberRulesFn = () => [
  {
    pattern: POSITIVE_INTEGER_REGEX,
    message: <Translation>
      {intl => intl.get('formRules.numberRequired')}
    </Translation>,
  },
];

export const replicaRulesFn = (activeMachineNum) => [
  {
    pattern: POSITIVE_INTEGER_REGEX,
    message: <Translation>
      {intl => intl.get('formRules.numberRequired')}
    </Translation>,
  },
  {
    validator(_rule, value, callback) {
      if (value && Number(value) > activeMachineNum) {
        callback(
          <Translation>
            {intl => intl.get('formRules.replicaLimit', { number: activeMachineNum })}
          </Translation>
        );
      }
      callback();
    },
  },
];

export const stringByteRulesFn = () => [
  { validator: (_, value) => {
    const byteLength = getByteLength(value);
    if (byteLength <= MAX_COMMENT_BYTES) {
      return Promise.resolve();
    }
    return Promise.reject(<Translation>
      {intl => intl.get('formRules.maxBytes', { max: MAX_COMMENT_BYTES })}
    </Translation>);
  } }
];