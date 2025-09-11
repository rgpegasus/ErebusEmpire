import React from 'react';
import UserDropdown from './components/user-dropdown/UserDropdown';
import OpenSideBar from './components/open-side-bar/OpenSideBar';
import SearchAnime from './components/search-anime/SearchAnime';
import NotificationDropdown from './components/notification-dropdown/NotificationDropdown';

 
function TopBar() {
  return (
    <div className='TopBar-box'> 
      <OpenSideBar/>
      <div className='TopBar-Categorie'>
        <NotificationDropdown/>
        <SearchAnime/>
        <UserDropdown/>
      </div>
    </div>  
  );
}

export default TopBar;
