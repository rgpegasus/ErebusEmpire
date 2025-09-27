import { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [username, setUsername] = useState("User");
  const [profileImage, setProfileImage] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [colorTheme, setColorTheme] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("username");
    const savedImage = localStorage.getItem("croppedProfileImage");
    const savedTheme = localStorage.getItem("theme");
    const savedColorTheme = localStorage.getItem("colorTheme") || "";

    if (savedName?.trim()) setUsername(savedName);
    if (savedImage) setProfileImage(savedImage);
    if (savedTheme?.trim()) setTheme(savedTheme);
    if (savedColorTheme?.trim()) setColorTheme(savedColorTheme);
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

  return (
    <UserContext.Provider
      value={{
        username,
        profileImage,
        theme,
        colorTheme,
        updateUser,
        updateTheme,
        updateColorTheme,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
