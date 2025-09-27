import React from 'react';
import UserDropdown from './components/user-dropdown/UserDropdown';
import OpenSideBar from './components/open-side-bar/OpenSideBar';
import SearchAnime from './components/search-anime/SearchAnime';
import NotificationDropdown from './components/notification-dropdown/NotificationDropdown';
import styles from './TopBar.module.css'
 
function TopBar() {
  return (
    <div className={styles.Container}> 
      <OpenSideBar/>
      <div className={styles.Categories}>
        <NotificationDropdown/>
        <SearchAnime/>
        <UserDropdown/>
      </div>
    </div>  
  );
}

export default TopBar;
