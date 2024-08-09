import { I18nLocalesInterface } from '../../../interfaces/i18n-locales.interface';
import { ModuleAFixture } from '../moduleA.module.fixture';
import enUS from './en/ModuleAFixture';
import ptBR from './pt/ModuleAFixture';

const LOCALES: I18nLocalesInterface[] = [
  {
    namespace: ModuleAFixture.name,
    language: 'en',
    resource: enUS,
  },
  {
    namespace: ModuleAFixture.name,
    language: 'pt',
    resource: ptBR,
  },
];

export default LOCALES;