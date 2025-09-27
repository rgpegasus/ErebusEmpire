import {
  FaListUl,
  FaFileDownload,
  FaDiscord,
  FaDonate,
  FaUserCircle,
  FaRegWindowMaximize, 
  FaRegWindowRestore, 
  FaRegWindowMinimize,
  FaShareSquare,
  FaCrown
} from "react-icons/fa";
import { 
  FaEye 
} from "react-icons/fa6";
import { 
  TbSearch 
} from "react-icons/tb";
import { 
  MdNotifications, 
  MdFavorite,
  MdClose
} from "react-icons/md"; 
import { 
  LuCircleCheckBig 
} from "react-icons/lu";
import { 
  IoSettingsSharp 
} from "react-icons/io5";
import { 
  PiClockCounterClockwiseBold 
} from "react-icons/pi";
import { 
  BsHourglassSplit 
} from "react-icons/bs";
import { 
  RxReload 
} from "react-icons/rx";
import { 
  ChevronDown,
  Sun,
  Moon, 
  Pipette,
  Palette
} from "lucide-react";
import ErebusIconSvg from "@resources/pictures/ErebusIcon.svg?react";
import ErebusIconTitleSvg from '@resources/pictures/ErebusIconTitle.svg?react';

export const CatalogIcon = (props) => <FaListUl {...props} />;
export const DownloadIcon = (props) => <FaFileDownload {...props} />;
export const DiscordIcon = (props) => <FaDiscord {...props} />;
export const DonateIcon = (props) => <FaDonate {...props} />; 
export const ProfileIcon = (props) => <FaUserCircle {...props} />;
export const WatchlistIcon = (props) => <FaEye {...props} />; 
export const SearchIcon = (props) => <TbSearch {...props} />;
export const NotificationIcon = (props) => <MdNotifications {...props} />;
export const FavoriteIcon = (props) => <MdFavorite {...props} />;
export const AlreadySeenIcon = (props) => <LuCircleCheckBig {...props} />;
export const SettingsIcon = (props) => <IoSettingsSharp {...props} />;
export const HistoryIcon = (props) => <PiClockCounterClockwiseBold {...props} />;
export const OnHoldIcon = (props) => <BsHourglassSplit {...props} />;
export const ErebusIcon = (props) => <ErebusIconSvg {...props} />;
export const ErebusIconTitle = (props) => <ErebusIconTitleSvg {...props} />;
export const MaximizeIcon = (props) => <FaRegWindowMaximize {...props} />;
export const WindowScreenIcon = (props) => <FaRegWindowRestore {...props} />;
export const MinimizeIcon = (props) => <FaRegWindowMinimize {...props} />;
export const ShareIcon = (props) => <FaShareSquare {...props} />;
export const CloseIcon = (props) => <MdClose {...props} />;
export const ReloadIcon = (props) => <RxReload {...props} />;
export const DownArrowIcon = (props) => <ChevronDown {...props} />;
export const SmallErebusIcon = (props) => <FaCrown {...props} />;
export const LightThemeIcon = (props) => <Sun {...props} />;
export const DarkThemeIcon = (props) => <Moon {...props} />;
export const ColorPickerIcon = (props) => <Pipette {...props} />;
export const ColorPaletteIcon = (props) => <Palette {...props} />;

