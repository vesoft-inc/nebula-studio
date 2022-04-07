import React, { useContext } from 'react';
import { Select } from 'antd';
import { INTL_LOCALE_SELECT } from '@app/config';
import Icon from '@app/components/Icon';
import { LanguageContext } from '@app/context';

import styles from './index.module.less';
const Option = Select.Option;

const LanguageSelect: React.FC = () => {
  const { currentLocale, toggleLanguage } = useContext(LanguageContext);
  return (
    <Select
      className={styles.selectLang}
      size="small"
      value={currentLocale}
      onChange={toggleLanguage}
      optionLabelProp="label"
    >
      {Object.keys(INTL_LOCALE_SELECT).map(locale => (
        <Option
          className={styles.dark}
          key={locale}
          value={INTL_LOCALE_SELECT[locale].NAME}
          label={
            <div className={styles.selectLabel}>
              <Icon type="icon-studio-nav-language" />
              {INTL_LOCALE_SELECT[locale].TEXT}
            </div>
          }
        >
          {INTL_LOCALE_SELECT[locale].TEXT}
        </Option>
      ))}
    </Select>
  );
};

export default LanguageSelect;
