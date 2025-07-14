import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  FaPlay, FaPause, FaVolumeUp, FaVolumeDown, FaVolumeOff, FaVolumeMute,
  FaUndoAlt, FaRedoAlt, FaExpand, FaCompress, FaStepForward,
  FaClone, FaDownload, FaArrowLeft
} from 'react-icons/fa';
import { MdPictureInPictureAlt } from 'react-icons/md';
import { LuSlidersHorizontal } from 'react-icons/lu';
import { FiX } from 'react-icons/fi';
import './VideoPlayer.css';
import { FlagDispatcher } from '@utils/FlagDispatcher';

export const ErebusPlayer = ({
  src,
  title = false,
  subTitle = false,
  titleMedia = false,
  cover = false,
  extraInfoMedia = false,
  fullPlayer = true,
  backButton = undefined,
  episodeSources = undefined,
  autoPlay = false,
  onEnded = undefined,
  onErrorVideo = undefined,
  onNextClick = undefined,
  onClickItemListReproduction = undefined,
  onDownloadClick = undefined,
  onCrossClick = undefined,
  startPosition = 0,
  dataNext = {},
  reprodutionList = [],
  onTimeUpdate = undefined, 
  overlayEnabled = true,
  primaryColor = 'var(--logo-color)',
  secundaryColor = 'var(--primary-text)',
  fontFamily = 'var(--font-main)',
  availableLanguages=undefined,
  currentLanguage=undefined,
  onChangeLanguage = undefined,
  settingsEnabled = true
}) => {
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const timerBuffer = useRef(null);
  const playerElement = useRef(null);
  const listReproduction = useRef(null);
  console.log("source", src)

  const [videoReady, setVideoReady] = useState(false);
  const [playing, setPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [end, setEnd] = useState(false);
  const [controlBackEnd, setControlBackEnd] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(false);
  const [waitingBuffer, setWaitingBuffer] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [started, setStarted] = useState(false);
  const [showControlVolume, setShowControlVolume] = useState(false);
  const [showDataNext, setShowDataNext] = useState(false);
  const [showReproductionList, setShowReproductionList] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [currentSource, setCurrentSource] = useState(src);

  const sources = episodeSources?.host?.map((host, i) => ({
    host,
    url: episodeSources.url[i],
  }));


  const secondsToHms = (d) => {
    d = Number(d);
    const h = Math.floor(d / 3600);
    const m = Math.floor((d % 3600) / 60);
    let s = Math.floor((d % 3600) % 60);
    let seconds = s.toString();

    if (s < 10) {
      seconds = `0${s}`;
    }

    if (h) {
      return `${h}:${m}:${seconds}`;
    }

    return `${m}:${seconds}`;
  };

  const timeUpdate = (e) => {
    setShowInfo(false);
    setEnd(false);
    if (playing) setPlaying(true);
    if (waitingBuffer) setWaitingBuffer(false);

    if (timerBuffer.current) clearTimeout(timerBuffer.current);
    timerBuffer.current = setTimeout(() => setWaitingBuffer(true), 5000);

    const target = e.target;
    setProgress(target.currentTime);

    if (typeof onTimeUpdate === 'function' && videoRef.current) {
      onTimeUpdate({ currentTime: videoRef.current.currentTime });
    }
  };


  const goToPosition = (position) => {
    if (videoRef.current) {
      videoRef.current.currentTime = position;
      setProgress(position);
    }
  };
  const handleSelectSource = (source) => {
    setCurrentSource(source.url);
    setShowSettingsMenu(false)
  };
  const play = () => {
    if (videoRef.current) {
      setPlaying(!playing);
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const onEndedFunction = () => {
    if (videoRef.current) {
      if (+startPosition === +videoRef.current.duration && !controlBackEnd) {
        setControlBackEnd(true);
        videoRef.current.currentTime = videoRef.current.duration - 30;
        if (autoPlay) {
          setPlaying(true);
          videoRef.current.play();
        } else {
          setPlaying(false);
        }
      } else {
        setEnd(true);
        setPlaying(false);
        if (onEnded) onEnded();
      }
    }
  };

  const nextSeconds = (seconds) => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;

      if (current + seconds >= total - 2) {
        videoRef.current.currentTime = total - 1;
        setProgress(videoRef.current.currentTime);
        return;
      }

      videoRef.current.currentTime += seconds;
      setProgress(videoRef.current.currentTime);
    }
  };

  const previousSeconds = (seconds) => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;

      if (current - seconds <= 0) {
        videoRef.current.currentTime = 0;
        setProgress(videoRef.current.currentTime);
        return;
      }

      videoRef.current.currentTime -= seconds;
      setProgress(videoRef.current.currentTime);
    }
  };

  const startVideo = () => {
    if (videoRef.current) {
      try {
        setDuration(videoRef.current.duration);
        setVideoReady(true);

        if (!started) {
          setStarted(true);
          setPlaying(false);
          if (autoPlay) {
            videoRef.current.play();
            setPlaying(!videoRef.current.paused);
          }
        }
      } catch (err) {
        setPlaying(false);
      }
    }
  };

  const errorVideo = () => {
    if (onErrorVideo) onErrorVideo();
    setError("Erreur de lecture");
  };

  const setMuttedAction = (value) => {
    if (videoRef.current) {
      setMuted(value);
      setShowControlVolume(false);
      videoRef.current.muted = value;
    }
  };

  const setVolumeAction = (value) => {
    if (videoRef.current) {
      setVolume(value);
      videoRef.current.volume = value / 100;
    }
  };

  const exitFullScreen = () => {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
      setFullScreen(false);
    }
  };

  const enterFullScreen = () => {
    if (playerElement.current) {
      if (playerElement.current.requestFullscreen) {
        playerElement.current.requestFullscreen();
        setFullScreen(true);
      }
    }
  };

  const chooseFullScreen = () => {
    if (playerElement.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        return;
      }
      if (playerElement.current.requestFullscreen) {
        playerElement.current.requestFullscreen();
      }
      setFullScreen(true);
    }
  };

  const setStateFullScreen = () => {
    if (!document.fullscreenElement) {
      setFullScreen(false);
      return;
    }
    setFullScreen(true);
  };


const controllScreenTimeOut = () => {
  if (showReproductionList) {
    return;
  }
  setShowControls(false);
  if (videoRef.current.paused) setShowInfo(true); 
};

const hoverScreen = () => {
  setShowControls(true);
  setShowInfo(false);
  if (timerRef.current) clearTimeout(timerRef.current);
  timerRef.current = setTimeout(controllScreenTimeOut, 2500);
};

const handleControlClick = (e) => {
  e?.stopPropagation(); 
  setShowControls(true);
  if (timerRef.current) clearTimeout(timerRef.current);
  timerRef.current = setTimeout(controllScreenTimeOut, 2500);
};
  const getKeyBoardInteration = (e) => {
    if (e.key === ' ' && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setPlaying(true);
        hoverScreen();
      } else {
        videoRef.current.pause();
        setPlaying(false);
        hoverScreen();
      }
    }
    if (e.key === 'ArrowLeft') {
      previousSeconds(5);
      hoverScreen();
    }
    if (e.key === 'ArrowRight') {
      nextSeconds(10);
      hoverScreen();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (videoRef.current) {
        const currentVol = videoRef.current.volume * 100;
        const newVol = Math.min(100, currentVol + 10);
        setVolumeAction(newVol);
      }
      hoverScreen();
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (videoRef.current) {
        const currentVol = videoRef.current.volume * 100;
        const newVol = Math.max(0, currentVol - 10);
        setVolumeAction(newVol);
      }
      hoverScreen();
    }
  };

  const scrollToSelected = () => {
    const element = listReproduction.current;
    if (element) {
      const selected = element.getElementsByClassName('selected')[0];
      const position = selected?.offsetTop;
      const height = selected?.offsetHeight;
      if (position && height) element.scrollTop = position - height * 2;
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  };
  
  useEffect(() => {
    if (showReproductionList) scrollToSelected();
  }, [showReproductionList]);

  useEffect(() => {
    if (currentSource && videoRef.current) {
      videoRef.current.currentTime = startPosition;
      setProgress(0);
      setDuration(0);
      setVideoReady(false);
      setError(false);
      setShowReproductionList(false);
      setShowDataNext(false);
      setPlaying(autoPlay);
    }
    if (fullPlayer) {
      enterFullScreen()
    }
  }, [currentSource]);
  useEffect(() => {
    const video = videoRef.current;
    const sync = () => setPlaying(!video.paused);
    video?.addEventListener('pause', sync);
    video?.addEventListener('play', sync);
    return () => {
      video?.removeEventListener('pause', sync);
      video?.removeEventListener('play', sync);
    };
  }, []);


  useEffect(() => {
    document.addEventListener('keydown', getKeyBoardInteration);
    document.addEventListener('fullscreenchange', setStateFullScreen);

    return () => {
      document.removeEventListener('keydown', getKeyBoardInteration);
      document.removeEventListener('fullscreenchange', setStateFullScreen);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (timerBuffer.current) clearTimeout(timerBuffer.current);
    };
  }, []);

  useEffect(() => {
    setStateFullScreen();
  }, [document.fullscreenElement]);

  useEffect(() => {
  if (videoRef.current && currentSource) {
    const isHLS = currentSource.includes(".m3u8");

    if (isHLS) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(currentSource);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (autoPlay) videoRef.current?.play();
        });
        return () => hls.destroy();
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = currentSource;
        if (autoPlay) videoRef.current.play();
      } else {
        setError("Format HLS non supporté par votre navigateur.");
      }
    } else {
      videoRef.current.src = currentSource;
      if (autoPlay) videoRef.current.play();
    }
  }
}, [currentSource]);


  const renderLoading = () => (
    <div className="loading" style={{ '--primaryColor': primaryColor }}>
      <div>
        <div />
        <div />
        <div />
      </div>
    </div>
  );

const renderInfoVideo = () => {
  return (
    <div 
      className={`standby-info ${showInfo && !showSettingsMenu && videoReady && !playing ? 'show' : ''}`}
      style={{ '--primaryColor': primaryColor, '--secundaryColor': secundaryColor }}
    >
      {(title || subTitle) && (
        <section className="center">
          <h3 className="text">Vous regardez</h3>
          <h1 className="title">{title}</h1>
          <h2 className="sub-title">{subTitle}</h2>
        </section>
      )}
      <footer>En pause</footer>
    </div>
  );
};


  const renderCloseVideo = () => (
    <div className={`video-pre-loading ${!videoReady || error ? 'show' : ''} ${error ? 'error' : ''}`}>
      {(title || subTitle) && (
        <header>
          <div>
            <h1>{title}</h1>
            <h2>{subTitle}</h2>
          </div>
          <FiX onClick={onCrossClick} />
        </header>
      )}
    </div>
  );

  const getVolumeIcon = () => {
    if (muted) return <FaVolumeMute />;
    if (volume >= 60) return <FaVolumeUp />;
    if (volume >= 10) return <FaVolumeDown />;
    if (volume > 0) return <FaVolumeOff />;
    return <FaVolumeMute />;
  };
  const clickTimeout = useRef(null);
const handleClick = () => {
    if (clickTimeout.current === null) {
      clickTimeout.current = setTimeout(() => {
        play();
        hoverScreen()
        clickTimeout.current = null;
      }, 250);
    }
  };
  const handleDoubleClick = () => {
    if (clickTimeout.current !== null) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
    }
    chooseFullScreen();
  };

  return (
    <div
      className={`container ${error ? 'hide-video' : ''}`}
      onMouseMove={hoverScreen}
      ref={playerElement}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{ fontFamily }}
    >
      {(videoReady === false || (waitingBuffer === true && playing === true)) && !error && !end && renderLoading()}

      {overlayEnabled && renderInfoVideo()}

      {renderCloseVideo()}

      <video
        ref={videoRef}
        src={currentSource}
        controls={false}
        onCanPlay={startVideo}
        onTimeUpdate={timeUpdate}
        onError={errorVideo}
        onEnded={onEndedFunction}
      />
{showSettingsMenu && (
<>
  <div
    className="settings-overlay"
    onClick={() => setShowSettingsMenu(false)}
  />
  <div
    className="settings-menu-slide"
    onClick={(e) => e.stopPropagation()}
  >
    <div className="settings-menu-header">
      <span>Paramètres</span>
      <button className="close-button" onClick={() => {setShowSettingsMenu(false);videoRef.current.play()}}>
        <FiX />
      </button>
    </div>
    <div className="settings-menu-content">
      <div className="SettingsMenuTop">
        <div className='SettingsMenuTop-cover'>
          <img
            src={cover}
            alt="Cover"
            draggable="false"
            className="SettingsMenuTop-image"
          />
        </div>
        <div className='SettingsMenuTop-title'>
          <div className='SettingsMenuTop-animeTitle'>{title}</div>
          <h1 className='SettingsMenuTop-subTitle'>{subTitle}</h1>
        </div>
      </div>
      <div className='TopBar-profile-separation'></div>
      <div className='SettingsMenuSources-list'>
        {sources?.map((source, index) => (
          <button
            key={index}
            onClick={() => handleSelectSource(source)}
            className={`SettingsMenuSources-item ${
              currentSource === source.url ? 'selected' : ''
            }`}
          >
            Lecteur {index + 1}
          </button>
        ))}
      </div>
      <div className='TopBar-profile-separation'></div>
      <div className="SettingsMenuAvailableLanguages">
        {availableLanguages.map((lang, index) => {
          const flag = FlagDispatcher(lang.toLowerCase());
          return (
            <span
              key={index}
              className={`SettingsMenuLanguageItem${currentLanguage === lang.toLowerCase() ? ' selected' : ''}`}
            >
              {flag && (
                <img
                  onClick={() => onChangeLanguage(lang.toLowerCase())}
                  src={flag}
                  alt={lang}
                  draggable='false'
                  className={`SettingsMenuLanguageItem-img${currentLanguage === lang.toLowerCase() ? ' selected' : ''}`}
                />
              )}
              <div className={`SettingsMenuLanguageItem-txt${currentLanguage === lang.toLowerCase() ? ' selected' : ''}`}>
                {lang.toUpperCase()}
              </div>
            </span>
          );
        }
        )}
      </div>
    </div>
  </div>
</>
)}

      <div className={`controls ${showControls && videoReady && !showSettingsMenu && !error ? 'show' : ''}`}>
        {backButton && (
          <div className="back" onClick={(e) => {handleControlClick(e)}} onDoubleClick={(e) => e.stopPropagation()} >
            <div onClick={backButton}  style={{ cursor: 'pointer' }}>
              <FaArrowLeft />
              <span>Saisons</span>
            </div>
          </div>
        )}

        {!showControlVolume && !showDataNext && !showReproductionList && (
          <div className="line-reproduction">
            <input
              type="range"
              value={progress}
              className="progress-bar"
              max={duration}
              onClick={(e) => {handleControlClick(e)}}
              onDoubleClick={(e) => e.stopPropagation()} 
              onChange={(e) => goToPosition(+e.target.value)}
              title=""
              style={{
                '--progress': `${(progress * 100) / duration}%`,
                '--primaryColor': primaryColor
              }}
            />
            <span>{secondsToHms(duration - progress)}</span>
          </div>
        )}

        {videoReady && (
          <div className="controls-content">
            <div className="start">
              <div className="item-control" onClick={(e) => {handleControlClick(e)}} onDoubleClick={(e) => e.stopPropagation()}>
                {!playing && (
                  <div className='IconSvg'><FaPlay onClick={() => play()} /></div>
                )}
                {playing && (
                  <div className='IconSvg'><FaPause onClick={() => play()} /></div>
                )}
              </div>

              <div className="item-control" onClick={(e) => {handleControlClick(e)}} onDoubleClick={(e) => e.stopPropagation()}>
                <div className='IconSvg'><FaUndoAlt onClick={() => previousSeconds(5)} /></div>
              </div>
              <div className="item-control" onClick={(e) => {handleControlClick(e)}} onDoubleClick={(e) => e.stopPropagation()}>
              <div className='IconSvg'><FaRedoAlt onClick={() => nextSeconds(10)} /></div>
              </div>

              {!muted && (
                <div 
                  className="item-control" 
                  onClick={(e) => {handleControlClick(e)}} onDoubleClick={(e) => e.stopPropagation()}
                  onMouseLeave={() => setShowControlVolume(false)}
                  style={{ '--primaryColor': primaryColor, '--percentVolume':  `${volume}%` }}
                >
                  {showControlVolume && (
                    <div className="volume-controller">
                      <div className="box-connector" />
                      <div className="box">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={videoRef.current?.volume ? videoRef.current.volume * 100 : volume}
                          onChange={(e) => setVolumeAction(Number(e.target.value))}
                          title=""
                        />
                      </div>
                    </div>
                  )}

                  <div 
                    onMouseEnter={() => setShowControlVolume(true)} 
                    onClick={() => setMuttedAction(true)} 
                  >
                    <div className='IconSvg'>{getVolumeIcon()}</div>
                  </div>
                </div>
              )}

              {muted && (
                <div className="item-control" onClick={(e) => {handleControlClick(e)}} onDoubleClick={(e) => e.stopPropagation()}>
                    <div className='IconSvg'><FaVolumeMute onClick={() => setMuttedAction(false)} /></div>
                </div>
              )}
              <div className="item-control info-video">
                <span className="info-first">{titleMedia}</span>
                <span className="info-secund">{extraInfoMedia}</span>
              </div>
            </div>

                <div className="end">
                {onNextClick && dataNext?.title && (
                    <div className="item-control" onClick={(e) => {handleControlClick(e)}} onDoubleClick={(e) => e.stopPropagation()}>
                    <div 
                        className="next-tooltip" 
                        data-tooltip={dataNext?.title || "Épisode suivant"}
                        onMouseEnter={() => setShowDataNext(true)}
                        onMouseLeave={() => setShowDataNext(false)}
                    >
                        <div className='IconSvg'><FaStepForward onClick={onNextClick} /></div>
                    </div>
                    </div>
                )}
                <div className="item-control" onMouseLeave={() => setShowReproductionList(false)} onClick={(e) => {handleControlClick(e)}} onDoubleClick={(e) => e.stopPropagation()}>
                {showReproductionList && (
                    <div className="item-list-reproduction-container"  >
                    <div>
                        <div className="title">Playlist</div>
                        <div ref={listReproduction} className="list-list-reproduction scroll-clean-player">
                        {reprodutionList.map((item, index) => (
                            <div
                            key={item.id}
                            className={`item-list-reproduction${item.playing ? ' selected' : ''}`}
                            onClick={() =>
                                onClickItemListReproduction && onClickItemListReproduction(item.id, item.playing)
                            }
                            >
                            <div className="bold">
                                {item.name}
                            </div>
                            {item.percent && <div className="percent" />}
                            </div>
                        ))}
                        </div>
                    </div>
                    <div className="box-connector" />
                    </div>
                )}
                {reprodutionList?.length > 1 && (
                  <div className='IconSvg'><FaClone onMouseEnter={() => setShowReproductionList(true)} /></div>
                )}
                </div>
              
              <div className="item-control" onClick={(e) => {handleControlClick(e)}} onDoubleClick={(e) => e.stopPropagation()}>
                <div className='IconSvg'><MdPictureInPictureAlt onClick={togglePiP}/></div>
              </div>
              
              {onDownloadClick && (
                <div className="item-control" onClick={(e) => {handleControlClick(e)}} onDoubleClick={(e) => e.stopPropagation()}>
                  <div className='IconSvg'><FaDownload onClick={onDownloadClick}/></div>
                </div>
              )}
              {settingsEnabled && (
                <div className="item-control" onClick={(e) => {
                  e?.stopPropagation(); 
                  setShowSettingsMenu(!showSettingsMenu);
                  videoRef.current.pause()
                }}>
                  <div className='IconSvg'><LuSlidersHorizontal /></div>
                </div>
              )}

              <div className="item-control" onClick={(e) => {handleControlClick(e)}} onDoubleClick={(e) => e.stopPropagation()}>
                {!fullScreen && <div className='IconSvg'><FaExpand onClick={enterFullScreen} /></div>}
                {fullScreen && <div className='IconSvg'><FaCompress onClick={exitFullScreen} /></div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

