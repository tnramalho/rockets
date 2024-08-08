
import { LocalesInterface } from "../../../interfaces/i18n-locales.interface";
import { ModuleBFixture } from "../moduleB.module.fixture";
import enUS from "./en/ModuleBFixture";
import ptBR from "./pt/ModuleBFixture";

const LOCALES: LocalesInterface[] = [{
  namespace: ModuleBFixture.name,
  language: 'en',
  resource: enUS,
}, {
  namespace: ModuleBFixture.name,
  language: 'pt',
  resource: ptBR,
}]

export default LOCALES;