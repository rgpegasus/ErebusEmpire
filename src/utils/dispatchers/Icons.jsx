import {
  FaListUl,
  FaFileDownload,
  FaDiscord,
  FaDonate,
  FaUserCircle
} from "react-icons/fa";
import { FaEye } from "react-icons/fa6";
import { TbSearch } from "react-icons/tb";
import { MdNotifications, MdFavorite } from "react-icons/md";
import { LuCircleCheckBig } from "react-icons/lu";
import { IoSettingsSharp } from "react-icons/io5";
import { PiClockCounterClockwiseBold } from "react-icons/pi";
import { BsHourglassSplit } from "react-icons/bs";

// Mapping entre noms courts et icônes
export const CatalogIcon = (props) => <FaListUl {...props} />;
export const DownloadIcon = (props) => <FaFileDownload {...props} />;
export const DiscordIcon = (props) => <FaDiscord {...props} />;
export const DonateIcon = (props) => <FaDonate {...props} />;
export const ProfilIcon = (props) => <FaUserCircle {...props} />;
export const WatchlistIcon = (props) => <FaEye {...props} />; 
export const SearchIcon = (props) => <TbSearch {...props} />;
export const NotificationIcon = (props) => <MdNotifications {...props} />;
export const FavoriteIcon = (props) => <MdFavorite {...props} />;
export const AlreadySeenIcon = (props) => <LuCircleCheckBig {...props} />;
export const SettingsIcon = (props) => <IoSettingsSharp {...props} />;
export const HistoryIcon = (props) => <PiClockCounterClockwiseBold {...props} />;
export const OnHoldIcon = (props) => <BsHourglassSplit {...props} />;
