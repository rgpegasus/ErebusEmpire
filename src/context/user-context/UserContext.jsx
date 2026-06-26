import { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [username, setUsername] = useState("User");
  const [profileImage, setProfileImage] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [colorTheme, setColorTheme] = useState("");
  const [toolBar, setToolBar] = useState(false);
  const [favoriteLanguage, setFavoriteLanguage] = useState("vostfr");

  useEffect(() => {
    const savedName = localStorage.getItem("username");
    const savedImage = localStorage.getItem("croppedProfileImage");
    const savedTheme = localStorage.getItem("theme");
    const savedColorTheme = localStorage.getItem("colorTheme") || "";
    const savedToolBar = localStorage.getItem("toolBar") || "";
    const savedFavoriteLanguage = localStorage.getItem("favoriteLanguage")
    if (savedName?.trim()) setUsername(savedName);
    if (savedImage) setProfileImage(savedImage);
    if (savedTheme?.trim()) setTheme(savedTheme);
    
    if (savedColorTheme?.trim()) setColorTheme(savedColorTheme);
    if (savedToolBar !== null) {
      setToolBar(savedToolBar === "true"); 
    }
    if (savedFavoriteLanguage) {
      setFavoriteLanguage(savedFavoriteLanguage)
    }
  }, []);

  const updateUser = (name, image) => {
    const finalName = name?.trim() || "User";
    setUsername(finalName);
    setProfileImage(image);

    localStorage.setItem("username", finalName);
    if (image) {
      localStorage.setItem("croppedProfileImage", image);
    } else {
      localStorage.removeItem("croppedProfileImage");
    }
  };

  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const updateColorTheme = (newColor) => {
    setColorTheme(newColor);
    localStorage.setItem("colorTheme", newColor);
  };
  const updateToolBar = (statePin) => {
    setToolBar(statePin);
    localStorage.setItem("toolBar", statePin);
  };
const updateFavoriteLanguage = (newLanguage) => {
    setFavoriteLanguage(newLanguage);
    localStorage.setItem("favoriteLanguage", newLanguage);
  };
  return (
    <UserContext.Provider
      value={{
        username,
        profileImage,
        theme,
        colorTheme,
        toolBar,
        favoriteLanguage,
        updateUser,
        updateTheme,
        updateColorTheme,
        updateToolBar,
        updateFavoriteLanguage
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
