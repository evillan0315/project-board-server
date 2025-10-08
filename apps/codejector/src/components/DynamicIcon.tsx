import React from 'react';

import { CarbonRowDelete } from '@/components/icons/CarbonRowDelete';
import { CarbonTerminal } from '@/components/icons/CarbonTerminal';
import { CarbonTerminal3270 } from '@/components/icons/CarbonTerminal3270';
import { CatppuccinYarnLock } from '@/components/icons/CatppuccinYarnLock';
import { ClarityLicenseSolid } from '@/components/icons/ClarityLicenseSolid';
import { CodiconLayoutPanelLeft } from '@/components/icons/CodiconLayoutPanelLeft';
import { CodiconLayoutPanelRight } from '@/components/icons/CodiconLayoutPanelRight';

import { EosIconsEnv } from '@/components/icons/EosIconsEnv';
import { FileIconsJsx } from '@/components/icons/FileIconsJsx';
import { FileIconsTsx } from '@/components/icons/FileIconsTsx';
import { FxemojiFolder } from '@/components/icons/FxemojiFolder';
import { FxemojiOpenfolder } from '@/components/icons/FxemojiOpenfolder';
import { GgReadme } from '@/components/icons/GgReadme';
import { LineMdFileDocumentPlusFilled } from '@/components/icons/LineMdFileDocumentPlusFilled';
import { MaterialIconThemeCss } from '@/components/icons/MaterialIconThemeCss';
import { MaterialIconThemeFolderPrompts } from '@/components/icons/MaterialIconThemeFolderPrompts';
import { MaterialIconThemeFolderResource } from '@/components/icons/MaterialIconThemeFolderResource';
import { MaterialIconThemeFolderUtils } from '@/components/icons/MaterialIconThemeFolderUtils';
import { MaterialIconThemeHtml } from '@/components/icons/MaterialIconThemeHtml';
import { MaterialIconThemeJsconfig } from '@/components/icons/MaterialIconThemeJsconfig';
import { MaterialIconThemeJson } from '@/components/icons/MaterialIconThemeJson';
import { MaterialIconThemeSvg } from '@/components/icons/MaterialIconThemeSvg';
import { MaterialIconThemeTsconfig } from '@/components/icons/MaterialIconThemeTsconfig';
import { MaterialIconThemeTypescript } from '@/components/icons/MaterialIconThemeTypescript';
import { MaterialIconThemeTypescriptDef } from '@/components/icons/MaterialIconThemeTypescriptDef';
import { MaterialSymbolsGifBox } from '@/components/icons/MaterialSymbolsGifBox';
import { MaterialSymbolsLightFilePng } from '@/components/icons/MaterialSymbolsLightFilePng';
import { MaterialSymbolsMarkdownRounded } from '@/components/icons/MaterialSymbolsMarkdownRounded';
import { MdiCodeJson } from '@/components/icons/MdiCodeJson';
import { MdiRenameBox } from '@/components/icons/MdiRenameBox';
import { MdiTerminalNetworkOutline } from '@/components/icons/MdiTerminalNetworkOutline';
import { SimpleIconsGitignoredotio } from '@/components/icons/SimpleIconsGitignoredotio';
import { TeenyiconsJavascriptOutline } from '@/components/icons/TeenyiconsJavascriptOutline';
import { VscodeIconsFileTypeTsconfig } from '@/components/icons/VscodeIconsFileTypeTsconfig';
import { RecordIcon } from '@/components/icons/RecordIcon';
import { StopIcon } from '@/components/icons/StopIcon';
import { ScreenshotIcon } from '@/components/icons/ScreenshotIcon';
import {
  CodiconLayoutSidebarLeftOff,
  CodiconLayoutSidebarLeft,
} from '@/components/icons/CodiconLayoutPanelLeft';
import {
  CodiconLayoutSidebarRight,
  CodiconLayoutSidebarRightOff,
} from '@/components/icons/CodiconLayoutPanelRight';

interface IconProps {
  iconName: string;
}

const iconMap: {
  [key: string]: React.ComponentType<any>;
} = {
  CarbonRowDelete,
  CarbonTerminal,
  CarbonTerminal3270,
  CatppuccinYarnLock,
  ClarityLicenseSolid,
  CodiconLayoutPanelLeft,
  CodiconLayoutPanelRight,
  CodiconLayoutSidebarRightOff,
  EosIconsEnv,
  FileIconsJsx,
  FileIconsTsx,
  FxemojiFolder,
  FxemojiOpenfolder,
  GgReadme,
  LineMdFileDocumentPlusFilled,
  MaterialIconThemeCss,
  MaterialIconThemeFolderPrompts,
  MaterialIconThemeFolderResource,
  MaterialIconThemeFolderUtils,
  MaterialIconThemeHtml,
  MaterialIconThemeJsconfig,
  MaterialIconThemeJson,
  MaterialIconThemeSvg,
  MaterialIconThemeTsconfig,
  MaterialIconThemeTypescript,
  MaterialIconThemeTypescriptDef,
  MaterialSymbolsGifBox,
  MaterialSymbolsLightFilePng,
  MaterialSymbolsMarkdownRounded,
  MdiCodeJson,
  MdiRenameBox,
  MdiTerminalNetworkOutline,
  SimpleIconsGitignoredotio,
  TeenyiconsJavascriptOutline,
  VscodeIconsFileTypeTsconfig,
  RecordIcon,
  StopIcon,
  ScreenshotIcon,
  CodiconLayoutSidebarLeft,
  CodiconLayoutSidebarRight,
  CodiconLayoutSidebarLeftOff,
};

const DynamicIcon: React.FC<IconProps> = ({ iconName }) => {
  const IconComponent = iconMap[iconName];

  if (!IconComponent) {
    return <span style={{ color: 'red' }}>Icon {iconName} not found</span>;
  }

  return <IconComponent />; // type-safe
};

export default DynamicIcon;
