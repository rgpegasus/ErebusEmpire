import React, {useState, useCallback, useRef, useEffect} from "react";
import Cropper from 'react-easy-crop';
import styles from './EditImg.module.css'
import OverlayPortal from "@components/overlay-portal/OverlayPortal";

const EditImg = ({imageSrc, setImageSrc, crop, setCrop, zoom, setZoom, onSave, setIsCropping}) => {
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const containerRef = useRef(null)

useEffect(() => {
  const handleClickOutside = (event) => {
    if (containerRef.current && !containerRef.current.contains(event.target)) {
      setImageSrc(null);
      setIsCropping(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);


  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.crossOrigin = 'anonymous';
      img.src = url;
    }
  );
  const getCroppedImg = async (imageSrc, croppedAreaPixels) => {
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext('2d');
  
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );
  
      return canvas.toDataURL('image/jpeg');
    };
    
  const showCroppedImage = useCallback(async () => {
      try {
        const cropped = await getCroppedImg(imageSrc, croppedAreaPixels);
        onSave(cropped);
        setImageSrc(null);
      } catch (e) {
        console.error('Erreur de recadrage', e);
      }
    }, [imageSrc, croppedAreaPixels]);
  
  const onCropComplete = useCallback((_, areaPixels) => setCroppedAreaPixels(areaPixels), []);

  return (
    <OverlayPortal>
      <div className={styles.Overlay} >
        <div className={styles.Container} ref={containerRef}>
          <div className={styles.TopContainer}>
            <h1 className={styles.Title}>Modifier l'image</h1>
            <span className={styles.Cancel} onClick={() => {setImageSrc(null); setIsCropping(false);}}>✖</span>
          </div>
          <div className={styles.Cropper}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              showGrid={false}
              cropShape="round"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className={styles.Zoom}>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(e.target.value)}
            />
          </div>
          <div className={styles.BottomContainer}>
            <button className={styles.Reset} onClick={() => {
              setCrop({ x: 0, y: 0 });
              setZoom(1);
            }}>Réinitialiser</button>
            <button className={styles.Apply} onClick={showCroppedImage}>Appliquer</button>
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
}

export default EditImg