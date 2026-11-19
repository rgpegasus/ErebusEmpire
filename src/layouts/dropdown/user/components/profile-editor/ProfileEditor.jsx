import React, { useState, useContext } from "react"
import { supabase } from "@services/supabase/Client" 
import { ProfileIcon, SmallErebusIcon } from "@utils/dispatchers/Icons"
import { UserContext } from "@context/user-context/UserContext"
import EditImg from "./components/edit-img/EditImg"
import styles from "./ProfileEditor.module.css"

function ProfileEditor({ editMode, setEditMode, setIsCropping }) {
  const { username, profileImage, updateUser } = useContext(UserContext)
  const [imageSrc, setImageSrc] = useState(null)
  const [tempUsername, setTempUsername] = useState(username)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [showOptions, setShowOptions] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [imageError, setImageError] = useState(false);
  const [error, setError] = useState(null)
  const handleProfileClick = () => {
    if (editMode) {
      setShowOptions(!showOptions)
      setIsCropping(false)
    }
  }

  const onFileChange = (e) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader()
      reader.onload = () => {
        setImageSrc(reader.result)
        setZoom(1)
        setCrop({ x: 0, y: 0 })
        setIsCropping(true)
      }
      reader.readAsDataURL(e.target.files[0])
      e.target.value = null
    }
  }
  const avatarPath = (uid) => `${uid}/avatar.jpg`

  const uploadAvatar = async (userId, dataUrl) => {
    const blob = await (await fetch(dataUrl)).blob()
    const path = avatarPath(userId)
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { contentType: "image/jpeg", upsert: true, cacheControl: "3600" })
    if (error) throw error
    const { data } = supabase.storage.from("avatars").getPublicUrl(path)
    return `${data.publicUrl}?t=${Date.now()}`
  }

  const saveProfile = async (userId, name, avatarUrl) => {
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, username: name, avatar_url: avatarUrl, updated_at: new Date().toISOString(), is_dev: false })
    if (error) throw error
  }

  const applyProfile = async (name, newAvatar) => {
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const uid = session?.user?.id
      let avatar = profileImage
      if (newAvatar === null) {
        if (uid) await supabase.storage.from("avatars").remove([avatarPath(uid)])
        avatar = null
      } else if (newAvatar) {
        avatar = uid ? await uploadAvatar(uid, newAvatar) : newAvatar
      }
      if (uid) await saveProfile(uid, name, avatar)
      updateUser(name, avatar)
    } catch (err) {
      console.error("[profile]", err)
      setError(err.message?.includes("check") ? "Pseudo invalide (1 à 16 caractères)." : "Impossible d'enregistrer le profil.")
    }
  }

  const handleSaveCropped = async (img) => {
    await applyProfile(tempUsername, img)
    setImageSrc(null)
    setIsCropping(false)
  }

  const resetProfilePhoto = async () => {
    await applyProfile(tempUsername, null)
    setShowOptions(false)
  }

  const handleUsernameChange = (e) => setTempUsername(e.target.value)

  const validateUsername = async () => {
    const finalName = tempUsername.trim() || "User"
    setTempUsername(finalName)
    await applyProfile(finalName)
    setIsEditingName(false)
  }

  const handleNameKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      validateUsername()
    }
  }

  return (
    <div className={styles.ProfileEditorContainer}>
      <div className={styles.ProfileEditor}>
        <div onClick={handleProfileClick}>
          {profileImage && !imageError ? (
            <img
              src={profileImage}
              alt="Profile"
              className={`${styles.ProfileImg} ${editMode ? styles.editable : ""}`}
              draggable="false"
              onError={() => setImageError(true)}
            />
          ) : (
            <ProfileIcon className={`${styles.ProfileImg} ${editMode ? styles.editable : ""}`} />
          )}

          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className={styles.InputEdit}
            id="upload"
          />

          {editMode && showOptions && (
            <div className={styles.EditContainer}>
              <label
                htmlFor="upload"
                onClick={() => document.getElementById("upload").click()}
                className={styles.EditOption}
              >
                Modifier l’image
              </label>
              <button className={styles.EditOption} onClick={resetProfilePhoto}>
                Supprimer l’image
              </button>
            </div>
          )}
        </div>

        <div className={styles.NameContainer}>
          <div className={styles.ProfileName} onClick={() => editMode && setIsEditingName(true)}>
            {isEditingName ? (
              <input
                className={styles.InputName}
                type="text"
                maxLength="16"
                value={tempUsername}
                onChange={handleUsernameChange}
                placeholder="Entrez un pseudo"
                onKeyDown={handleNameKeyDown}
                onBlur={validateUsername}
                autoFocus
              />
            ) : (
              <div className={`${styles.ProfileName} ${editMode ? styles.editable : ""}`}>
                {username}
              </div>
            )}
          </div>

          <div className={styles.AppContainer}>
            <SmallErebusIcon className={styles.AppLogo} />
            <h1 className={styles.AppTitle}>Erebus Empire</h1>
          </div>
        </div>
      </div>

      {error && <div role="alert" className={styles.ProfileError}>{error}</div>}
      <div className={styles.EditContainerButton}>
        <span className={styles.EditButton} onClick={() => setEditMode((prev) => !prev)}>
          {editMode ? "✖" : "✎"}
        </span>
      </div>

      {imageSrc && (
        <EditImg
          imageSrc={imageSrc}
          setImageSrc={setImageSrc}
          crop={crop}
          setCrop={setCrop}
          zoom={zoom}
          setZoom={setZoom}
          onSave={handleSaveCropped}
          setIsCropping={setIsCropping}
        />
      )}
    </div>
  )
}

export default ProfileEditor
