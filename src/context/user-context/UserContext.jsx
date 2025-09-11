import { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [username, setUsername] = useState("User");
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const savedName = localStorage.getItem("username");
    const savedImage = localStorage.getItem("croppedProfileImage");

    if (savedName?.trim()) setUsername(savedName);
    if (savedImage) setProfileImage(savedImage);
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

  return (
    <UserContext.Provider value={{ username, profileImage, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};
