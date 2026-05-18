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

  // Upload avatar dans Supabase Storage et retourne l'URL publique
  const uploadAvatar = async (fileDataUrl) => {
    try {
      const user = await supabase.auth.getUser()
      if (!user.data.user) throw new Error("Utilisateur non connecté")

      const id = user.data.user.id
      const fileName = `avatars/${id}_${Date.now()}.png`
      const base64 = fileDataUrl.split(",")[1]
      const file = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(fileName)
      return publicData.publicUrl
    } catch (err) {
      console.error("Erreur uploadAvatar:", err.message)
      return null
    }
  }

  const updateProfile = async (usernameToUpdate, avatar_url) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) throw new Error("Utilisateur non connecté")
      const id = userData.user.id

      // Vérifie si le profil existe
      const { data: existing, error: selectError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single()

      // si erreur autre que "no rows found", throw
      if (selectError && selectError.code !== "PGRST116") {
        throw selectError
      }

      if (existing) {
        // UPDATE si existe
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ username: usernameToUpdate, avatar_url })
          .eq("id", id)
        if (updateError) throw updateError
      } else {
        // INSERT sinon
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id,
            username: usernameToUpdate,
            avatar_url,
            created_at: new Date().toISOString(),
          })
        if (insertError) throw insertError
      }

      updateUser(usernameToUpdate, avatar_url)
      console.log("Profil mis à jour avec succès !")
    } catch (err) {
      console.error("Erreur updateProfile:", err.message)
    }
  }

  const handleSaveCropped = async (img) => {
    const avatarUrl = await uploadAvatar(img)
    if (avatarUrl) {
      await updateProfile(tempUsername, avatarUrl)
    }
    setImageSrc(null)
    setIsCropping(false)
  }

  const resetProfilePhoto = async () => {
    await updateProfile(tempUsername, null)
    setShowOptions(false)
  }

  const handleUsernameChange = (e) => setTempUsername(e.target.value)

  const validateUsername = async () => {
    const finalName = tempUsername.trim() || "User"
    setTempUsername(finalName)
    await updateProfile(finalName, profileImage)
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
          {profileImage ? (
            <img
              src={profileImage}
              alt="Profil"
              className={`${styles.ProfileImg} ${editMode ? styles.editable : ""}`}
              draggable="false"
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
