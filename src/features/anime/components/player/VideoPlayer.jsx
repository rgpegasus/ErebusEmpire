import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  FaPlay, FaPause, FaVolumeUp, FaVolumeDown, FaVolumeOff, FaVolumeMute,
  FaUndoAlt, FaRedoAlt, FaExpand, FaCompress, FaStepForward, FaCog,
  FaClone, FaDownload, FaArrowLeft
} from 'react-icons/fa';
import { MdPictureInPictureAlt } from 'react-icons/md';
import { FiCheck, FiX } from 'react-icons/fi';
import './VideoPlayer.css';

export const ErebusPlayer = ({
  src,
  title = false,
  subTitle = false,
  titleMedia = false,
  extraInfoMedia = false,
  fullPlayer = true,
  backButton = undefined,
  autoPlay = false,
  onEnded = undefined,
  onErrorVideo = undefined,
  onNextClick = undefined,
  onClickItemListReproduction = undefined,
  onDownloadClick = undefined,
  onCrossClick = () => {},
  startPosition = 0,
  dataNext = {},
  reprodutionList = [],
  qualities = [],
  onChangeQuality = () => {},
  overlayEnabled = true,
  autoControllCloseEnabled = true,
  primaryColor = 'var(--logo-color)',
  secundaryColor = 'var(--primary-text)',
  fontFamily = 'var(--font-main)',
}) => {
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const timerBuffer = useRef(null);
  const playerElement = useRef(null);
  const listReproduction = useRef(null);

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
  const [showQuality, setShowQuality] = useState(false);
  const [showDataNext, setShowDataNext] = useState(false);
  const [showReproductionList, setShowReproductionList] = useState(false);

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
  };

  const goToPosition = (position) => {
    if (videoRef.current) {
      videoRef.current.currentTime = position;
      setProgress(position);
    }
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

  const erroVideo = () => {
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
      setShowInfo(true);
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

      setShowInfo(true);
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

  if (!autoControllCloseEnabled) {
    setShowInfo(true);
    return;
  }

  setShowControls(false);
  if (!playing) setShowInfo(true);
};

const hoverScreen = () => {
  setShowControls(true);
  setShowInfo(false);

  if (timerRef.current) clearTimeout(timerRef.current);
  timerRef.current = setTimeout(controllScreenTimeOut, 2500);
};

const handleControlClick = (e) => {
  e?.stopPropagation(); // Le '?' évite les erreurs si 'e' est undefined
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
    if (src && videoRef.current) {
      videoRef.current.currentTime = startPosition;
      setProgress(0);
      setDuration(0);
      setVideoReady(false);
      setError(false);
      setShowReproductionList(false);
      setShowDataNext(false);
      setPlaying(autoPlay);
    }
  }, [src]);

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
    if (videoRef.current && src) {
      const isHLS = src.includes(".m3u8");
      if (isHLS) {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(src);
          hls.attachMedia(videoRef.current);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (autoPlay) videoRef.current?.play();
          });
          return () => hls.destroy();
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = src;
          if (autoPlay) videoRef.current.play();
        } else {
          setError("Format HLS non supporté par votre navigateur.");
        }
      } else {
        videoRef.current.src = src;
        console.log("source", videoRef.current.src)
        if (autoPlay) videoRef.current.play();
      }
    }
  }, [src]);

  const renderLoading = () => (
    <div className="loading" style={{ '--primaryColor': primaryColor }}>
      <div>
        <div />
        <div />
        <div />
      </div>
    </div>
  );

  const renderInfoVideo = () => (
    <div 
      className={`standby-info ${showInfo && videoReady && !playing ? 'show' : ''}`}
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

      <section>
        {error && (
          <div>
            <h1>{error}</h1>
            {qualities.length > 1 && (
              <div>
                <p>Essayez d'accéder à une autre qualité</p>
                <div className="links-error">
                  {qualities.map(item => (
                    <div key={item.id} onClick={() => onChangeQuality(item.id)}>
                      {item.prefix && <span>HD</span>}
                      <span>{item.name}</span>
                      {item.playing && <FiX />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );

  const getVolumeIcon = () => {
    if (muted) return <FaVolumeMute />;
    if (volume >= 60) return <FaVolumeUp />;
    if (volume >= 10) return <FaVolumeDown />;
    return <FaVolumeOff />;
  };

  return (
    <div
      className={`container ${fullPlayer ? 'full-player' : ''} ${error ? 'hide-video' : ''}`}
      onMouseMove={hoverScreen}
      ref={playerElement}
      onDoubleClick={chooseFullScreen}
      onClick={play}
      style={{ fontFamily }}
    >
      {(videoReady === false || (waitingBuffer === true && playing === true)) && !error && !end && renderLoading()}

      {overlayEnabled && renderInfoVideo()}

      {renderCloseVideo()}

      <video
        ref={videoRef}
        src={src}
        controls={false}
        onCanPlay={startVideo}
        onTimeUpdate={timeUpdate}
        onError={erroVideo}
        onEnded={onEndedFunction}
      />

      <div className={`controls ${showControls && videoReady && !error ? 'show' : ''}`}>
        {backButton && (
          <div className="back">
            <div onClick={() => backButton} onDoubleClick={(e) => e.stopPropagation()} style={{ cursor: 'pointer' }}>
              <FaArrowLeft />
              <span>Retour</span>
            </div>
          </div>
        )}

        {!showControlVolume && !showQuality && !showDataNext && !showReproductionList && (
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
                  <FaPlay onClick={() => play()} />
                )}
                {playing && (
                  <FaPause onClick={() => play()} />
                )}
              </div>

              <div className="item-control" onClick={(e) => {handleControlClick(e)}} onDoubleClick={(e) => e.stopPropagation()}>
              <FaUndoAlt 
                  onClick={() => previousSeconds(5)} />
              </div> 
              <div className="item-control" onClick={(e) => {handleControlClick(e)}} onDoubleClick={(e) => e.stopPropagation()}>
              <FaRedoAlt onClick={() => nextSeconds(10)} />
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
                    {getVolumeIcon()}
                  </div>
                </div>
              )}

              {muted && (
                <div className="item-control" onClick={(e) => {handleControlClick(e)}} onDoubleClick={(e) => e.stopPropagation()}>
                    <FaVolumeMute onClick={() => setMuttedAction(false)} />
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
                        <FaStepForward onClick={onNextClick} />
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
                                {/* <span style={{ marginRight: 15 }}>{index + 1}</span> */}
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
                    <FaClone onMouseEnter={() => setShowReproductionList(true)} />
                )}
                </div>


              {qualities?.length > 1 && (
                <div className="item-control" onClick={(e) => {handleControlClick(e)}} onDoubleClick={(e) => e.stopPropagation()} onMouseLeave={() => setShowQuality(false)}>
                  {showQuality && (
                    <div className="item-list-quality">
                      <div>
                        {qualities.map(item => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setShowQuality(false);
                              onChangeQuality(item.id);
                            }}
                          >
                            {item.prefix && <span>HD</span>}
                            <span>{item.name}</span>
                            {item.playing && <FiCheck />}
                          </div>
                        ))}
                      </div>
                      <div className="box-connector" />
                    </div>
                  )}

                  <FaCog onMouseEnter={() => setShowQuality(true)} />
                </div>
              )}
              
              <div className="item-control" onClick={(e) => {handleControlClick(e)}} onDoubleClick={(e) => e.stopPropagation()}>
                <MdPictureInPictureAlt onClick={() => togglePiP} onDoubleClick={(e) => e.stopPropagation()} />
              </div>
              
              {onDownloadClick && (
                <div className="item-control" onClick={(e) => {handleControlClick(e)}} onDoubleClick={(e) => e.stopPropagation()}>
                  <FaDownload
                    onClick={onDownloadClick}
                    onDoubleClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              <div className="item-control" onClick={(e) => {handleControlClick(e)}} onDoubleClick={(e) => e.stopPropagation()}>
                {!fullScreen && <FaExpand onClick={enterFullScreen} />}
                {fullScreen && <FaCompress onClick={exitFullScreen} />}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

