import React, { useState } from 'react';
import ProfileModifier from '../components/profilePage/ProfileModifier';
import Favoris from '../components/profilePage/Favoris';
import Watchlist from '../components/profilePage/Watchlist';
import EnCours from '../components/profilePage/EnCours';
import EnAttente from '../components/profilePage/EnAttente';
import Vu from '../components/profilePage/Vu';
import Parametres from '../components/profilePage/Parametres';
import logo_favoris from "../../../../resources/pictures/logo_favoris.png";
import logo_watchlist from "../../../../resources/pictures/logo_watchlist.png";
import logo_enCours from "../../../../resources/pictures/logo_enCours.png";
import logo_enAttente from "../../../../resources/pictures/logo_enAttente.png";
import logo_vu from "../../../../resources/pictures/logo_vu.png";
import logo_settings from "../../../../resources/pictures/logo_settings.png";


const tabs = [
  { key: "parametres", label: "Paramètres" , img: logo_settings},
  { key: "favoris", label: "Favoris" , img: logo_favoris},
  { key: "watchlist", label: "Watchlist" , img: logo_watchlist},
  { key: "enCours", label: "En cours" , img: logo_enCours},
  { key: "enAttente", label: "En attente", img: logo_enAttente},
  { key: "vu", label: "Vu" , img: logo_vu},

];

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("parametres");

  const renderTabContent = () => {
    switch (activeTab) {
      case "favoris": return <Favoris />;
      case "watchlist": return <Watchlist />;
      case "enCours": return <EnCours />;
      case "enAttente": return <EnAttente />;
      case "vu": return <Vu />;
      case "parametres": return <Parametres />;
      default: return null;
    }
  };

  return (
    <div className="MainPage">
      <ProfileModifier />
      <div className='ProfilCategorie'>
          {tabs.map(tab => (
            <div
              key={tab.key}
              className={`ProfilCategorie-item ${activeTab === tab.key ? "selected" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <img src={tab.img} alt={tab.label} />
              {tab.label}
            </div>
          ))}
        </div>
      <div className='Space'></div>
      <div className='ProfileInfo'>
        <div className='ProfilContent'>
          {renderTabContent()}
        </div>
      </div>
      <div className='Space'></div>
    </div>
  );
};

export default ProfilePage;
