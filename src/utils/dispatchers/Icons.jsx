import {
  FaDiscord,
  FaDonate,
  FaUserCircle,
  FaShareSquare,
  FaCrown,
  FaPlay 
} from "react-icons/fa";
import { ImDownload2 } from "react-icons/im";
import { VscChromeClose, VscChromeMaximize, VscChromeMinimize, VscChromeRestore, VscBell  } from "react-icons/vsc";
import { 
  FaEye 
} from "react-icons/fa6";
import { 
  MdFavorite,
} from "react-icons/md"; 
import { 
  LuCircleCheckBig 
} from "react-icons/lu";
import { 
  IoSettingsSharp 
} from "react-icons/io5";
import { 
  PiClockCounterClockwiseBold,
  PiPushPinSimpleBold,
  PiPushPinSimpleSlashBold,

} from "react-icons/pi";
import { 
  BsHourglassSplit 
} from "react-icons/bs";
import { 
  RxReload 
} from "react-icons/rx";
import { 
  Sun,
  Moon, 
  Pipette,
  Palette
} from "lucide-react";
import { SlGrid } from "react-icons/sl";
import ErebusIconSvg from "@resources/pictures/ErebusIcon.svg?react";
import ErebusIconTitleSvg from '@resources/pictures/ErebusIconTitle.svg?react';
import AddIconSvg from '@resources/pictures/AddIcon.svg?react';
import ArrowIconSvg from '@resources/pictures/ArrowIcon.svg?react';
import GridModeSvg from '@resources/pictures/GridModeIcon.svg?react';
import CarouselModeIconSvg from '@resources/pictures/CarouselModeIcon.svg?react';
import SortIconSvg from '@resources/pictures/SortIcon.svg?react';
import SearchIconSvg from '@resources/pictures/SearchIcon.svg?react';
import ScanIconSvg from "@resources/pictures/ScanIcon.svg?react"
export const CatalogIcon = (props) => <SlGrid {...props} />;
export const DownloadIcon = (props) => <ImDownload2 {...props} />;
export const DiscordIcon = (props) => <FaDiscord {...props} />;
export const DonateIcon = (props) => <FaDonate {...props} />; 
export const ProfileIcon = (props) => <FaUserCircle {...props} />;
export const WatchlistIcon = (props) => <FaEye {...props} />; 
export const SearchIcon = (props) => <SearchIconSvg {...props} />;
export const NotificationIcon = (props) => <VscBell  {...props} />;
export const FavoriteIcon = (props) => <MdFavorite {...props} />;
export const AlreadySeenIcon = (props) => <LuCircleCheckBig {...props} />;
export const SettingsIcon = (props) => <IoSettingsSharp {...props} />;
export const HistoryIcon = (props) => <PiClockCounterClockwiseBold {...props} />;
export const OnHoldIcon = (props) => <BsHourglassSplit {...props} />;
export const ErebusIcon = (props) => <ErebusIconSvg {...props} />;
export const ErebusIconTitle = (props) => <ErebusIconTitleSvg {...props} />;
export const MaximizeIcon = (props) => <VscChromeMaximize {...props} />;
export const WindowScreenIcon = (props) => <VscChromeRestore {...props} />;
export const MinimizeIcon = (props) => <VscChromeMinimize {...props} />;
export const ShareIcon = (props) => <FaShareSquare {...props} />;
export const CloseIcon = (props) => <VscChromeClose {...props} />;
export const ReloadIcon = (props) => <RxReload {...props} />;
export const ArrowIcon = (props) => <ArrowIconSvg {...props} />;
export const SmallErebusIcon = (props) => <FaCrown {...props} />;
export const LightThemeIcon = (props) => <Sun {...props} />;
export const DarkThemeIcon = (props) => <Moon {...props} />;
export const ColorPickerIcon = (props) => <Pipette {...props} />;
export const ColorPaletteIcon = (props) => <Palette {...props} />;
export const PlayIcon = (props) => <FaPlay {...props} style={{ ...(props.style || {}), transform: "scaleX(1.125)" }} />
export const AddIcon = (props) => <AddIconSvg {...props} />;
export const GridModeIcon = (props) => <GridModeSvg {...props} />;
export const CarouselModeIcon = (props) => <CarouselModeIconSvg  {...props} />;
export const SortIcon = (props) => <SortIconSvg {...props} />;
export const PinIcon = (props) => <PiPushPinSimpleBold {...props} />;
export const UnpinIcon = (props) => <PiPushPinSimpleSlashBold {...props} />;
export const ScanIcon = (props) => <ScanIconSvg {...props} />


