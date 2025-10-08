import React from 'react';
import ArticleOutlined from '@mui/icons-material/ArticleOutlined';
import ImageOutlined from '@mui/icons-material/ImageOutlined';
import AttachFileOutlined from '@mui/icons-material/AttachFileOutlined';
import SmartToyOutlined from '@mui/icons-material/SmartToyOutlined';
import ApiOutlined from '@mui/icons-material/ApiOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import StarsOutlined from '@mui/icons-material/StarsOutlined';
import FlashOnOutlined from '@mui/icons-material/FlashOnOutlined';
import VideocamOutlined from '@mui/icons-material/VideocamOutlined';
import PaletteOutlined from '@mui/icons-material/PaletteOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined'; // Default/fallback icon

type RequestTypeIconMap = { [key: string]: React.ElementType };

export const requestTypeIcons: RequestTypeIconMap = {
  TEXT_ONLY: ArticleOutlined,
  TEXT_WITH_IMAGE: ImageOutlined,
  TEXT_WITH_FILE: AttachFileOutlined,
  LLM_GENERATION: SmartToyOutlined,
  LIVE_API: ApiOutlined,
  RESUME_GENERATION: DescriptionOutlined,
  RESUME_OPTIMIZATION: StarsOutlined,
  RESUME_ENHANCEMENT: FlashOnOutlined,
  VIDEO_GENERATION: VideocamOutlined,
  IMAGE_GENERATION: PaletteOutlined,
};

export const defaultRequestTypeIcon = AutoAwesomeOutlined;
