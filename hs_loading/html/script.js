class LoadingScreen {
  constructor() {
    this.progress = 0
    this.isPlaying = false
    this.volume = 0.06
    this.isMuted = false
    this.currentTrack = 0

    // Music tracks
    this.musicTracks = [{ title: "DVRKHOLD", artist: "Sun", src: "assets/music1.mp3" }]

    this.loadingMessages = [
      "INITIALIZING...",
      "CONNECTING TO SERVER...",
      "LOADING GAME FILES...",
      "PREPARING WORLD...",
      "LOADING SCRIPTS...",
      "SYNCHRONIZING DATA...",
      "FINALIZING SETUP...",
      "ENTERING WORLD...",
    ]

    this.currentMessageIndex = 0
    this.videoInitialized = false
    this.videoFallbackActive = false
    this.init()
  }

  async startAutoplay() {
    try {
      await this.playMusic()
    } catch (error) {
      const enableAutoplay = () => {
        this.playMusic()
        document.removeEventListener("click", enableAutoplay)
        document.removeEventListener("keydown", enableAutoplay)
      }

      document.addEventListener("click", enableAutoplay)
      document.addEventListener("keydown", enableAutoplay)
    }
  }

  activateFallback() {
    if (!this.videoFallbackActive) {
      const fallbackBg = document.getElementById("fallbackBg")
      if (fallbackBg) {
        fallbackBg.classList.add("active")
        this.videoFallbackActive = true
      }
    }
  }

  waitForVideoElement() {
    return new Promise((resolve) => {
      const checkVideo = () => {
        const videoElement = document.querySelector("#backgroundVideo")
        if (videoElement) {
          resolve(videoElement)
        } else {
          setTimeout(checkVideo, 100)
        }
      }
      checkVideo()
    })
  }

  checkVideoVisibility(videoElement) {
    const rect = videoElement.getBoundingClientRect()
    const style = window.getComputedStyle(videoElement)

    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden"
  }

  async initVideo() {
    try {
      const videoElement = await this.waitForVideoElement()

      if (this.videoInitialized) {
        return
      }

      videoElement.muted = true
      videoElement.loop = true
      videoElement.autoplay = true
      videoElement.playsInline = true
      videoElement.controls = false
      videoElement.preload = "auto"

      videoElement.crossOrigin = "anonymous"

      const fallbackTimeout = setTimeout(() => {
        this.activateFallback()
      }, 10000)

      videoElement.addEventListener("loadstart", () => {})

      videoElement.addEventListener("loadedmetadata", () => {})

      videoElement.addEventListener("loadeddata", () => {
        this.forceVideoPlay(videoElement)
      })

      videoElement.addEventListener("canplay", () => {
        clearTimeout(fallbackTimeout)
        this.forceVideoPlay(videoElement)
      })

      videoElement.addEventListener("canplaythrough", () => {
        clearTimeout(fallbackTimeout)
        this.forceVideoPlay(videoElement)
      })

      videoElement.addEventListener("playing", () => {
        clearTimeout(fallbackTimeout)
        setTimeout(() => {
          this.checkVideoVisibility(videoElement)
        }, 1000)
      })

      videoElement.addEventListener("pause", () => {
        setTimeout(() => this.forceVideoPlay(videoElement), 100)
      })

      videoElement.addEventListener("stalled", () => {
        setTimeout(() => {
          videoElement.load()
        }, 1000)
      })

      videoElement.addEventListener("error", (e) => {
        if (videoElement.error) {
        }
        clearTimeout(fallbackTimeout)
        this.activateFallback()
      })

      // FORCE load
      videoElement.load()

      // Poskusi predvajati po kratkem času
      setTimeout(() => {
        this.forceVideoPlay(videoElement)
      }, 1000)

      // Agresivno ponavljanje za FiveM
      const videoInterval = setInterval(() => {
        if (videoElement.paused && videoElement.readyState >= 2) {
          this.forceVideoPlay(videoElement)
        }
      }, 3000)

      // Ustavi interval po 30 sekundah
      setTimeout(() => {
        clearInterval(videoInterval)
      }, 30000)

      this.videoInitialized = true
    } catch (error) {
      this.activateFallback()
    }
  }

  // IZBOLJŠANA FUNKCIJA: Agresivno predvajanje
  async forceVideoPlay(videoElement) {
    if (!videoElement) return

    try {
      // Ponovno nastavi lastnosti
      videoElement.muted = true
      videoElement.loop = true
      videoElement.autoplay = true

      const playPromise = videoElement.play()

      if (playPromise !== undefined) {
        await playPromise

        // Preveri ali se res predvaja
        setTimeout(() => {
          if (!videoElement.paused) {
          } else {
          }
        }, 500)
      }
    } catch (error) {
      // Poskusi ponovno
      setTimeout(() => {
        videoElement.play().catch((e) => {
          this.activateFallback()
        })
      }, 1000)
    }
  }

  init() {
    // FiveM NUI focus
    const nuiFocusInterval = setInterval(() => {
      if (window.invokeNative) {
        window.invokeNative("SET_NUI_FOCUS", true, true)
      }
    }, 200)

    setTimeout(() => {
      clearInterval(nuiFocusInterval)
    }, 10000)

    this.setupAudio()
    this.setupEventListeners()
    this.updateVolumeDisplay()
    this.loadTrack()

    // Video inicializacija z zakasnitev
    setTimeout(() => {
      this.initVideo()
    }, 1500)

    // Autoplay glasbe
    setTimeout(() => {
      this.startAutoplay()
    }, 2500)
  }

  setupAudio() {
    this.audio = new Audio()
    this.audio.loop = false
    this.audio.volume = this.volume
    this.audio.preload = "auto"

    this.audio.addEventListener("ended", () => this.nextTrack())
    this.audio.addEventListener("loadeddata", () => this.updateTrackInfo())
    this.audio.addEventListener("canplay", () => {})
    this.audio.addEventListener("error", (e) => {})
  }

  setupEventListeners() {
    // Music player controls
    const playBtn = document.getElementById("playBtn")
    const pauseBtn = document.getElementById("pauseBtn")
    const prevBtn = document.getElementById("prevBtn")
    const nextBtn = document.getElementById("nextBtn")
    const volumeBtn = document.getElementById("volumeBtn")
    const volumeSlider = document.getElementById("volumeSlider")

    playBtn?.addEventListener("click", () => this.playMusic())
    pauseBtn?.addEventListener("click", () => this.pauseMusic())
    prevBtn?.addEventListener("click", () => this.previousTrack())
    nextBtn?.addEventListener("click", () => this.nextTrack())
    volumeBtn?.addEventListener("click", () => this.toggleMute())
    volumeSlider?.addEventListener("input", (e) => this.setVolume(e.target.value / 100))

    // Navigation buttons
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const text = e.currentTarget.textContent.trim()
        this.openModal(text)
      })
    })

    // Modal close
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-overlay") || e.target.classList.contains("modal-close")) {
        this.closeModal()
      }
    })

    // FiveM events
    window.addEventListener("message", (event) => {
      const data = event.data

      switch (data.eventName) {
        case "loadProgress":
          this.setProgress(data.loadFraction * 100)
          break
        case "onLogLine":
          this.handleLogMessage(data.message)
          break
        case "onDataFileEntry":
          this.handleDataFile(data.name)
          break
        case "playerSpawned":
          this.fadeOut()
          break
      }
    })
  }

  setProgress(newProgress) {
    this.progress = Math.min(Math.max(newProgress, 0), 100)
    this.updateProgressBar()
    this.updateLoadingMessage()
  }

  updateProgressBar() {
    const progressFill = document.getElementById("progressFill")
    if (progressFill) {
      progressFill.style.width = `${this.progress}%`
    }
  }

  updateLoadingMessage() {
    const statusText = document.getElementById("statusText")
    if (!statusText) return

    const messageIndex = Math.floor((this.progress / 100) * (this.loadingMessages.length - 1))
    const message = this.loadingMessages[messageIndex] || this.loadingMessages[0]

    if (this.currentMessageIndex !== messageIndex) {
      this.currentMessageIndex = messageIndex
      statusText.style.opacity = "0"

      setTimeout(() => {
        statusText.textContent = message
        statusText.style.opacity = "1"
      }, 300)
    }
  }

  handleLogMessage(message) {
    const statusText = document.getElementById("statusText")
    if (message.includes("Downloading")) {
      statusText.textContent = "DOWNLOADING RESOURCES..."
    } else if (message.includes("Loading")) {
      statusText.textContent = "LOADING GAME DATA..."
    }
  }

  handleDataFile(fileName) {
    const statusText = document.getElementById("statusText")
    statusText.textContent = `LOADING ${fileName.toUpperCase()}...`
  }

  // MUSIC FUNCTIONS
  async playMusic() {
    try {
      if (this.audio && this.audio.src) {
        await this.audio.play()
        this.isPlaying = true
        this.updateMusicButtons()
      }
    } catch (error) {
      this.loadTrack()
    }
  }

  pauseMusic() {
    if (this.audio) {
      this.audio.pause()
      this.isPlaying = false
      this.updateMusicButtons()
    }
  }

  previousTrack() {
    this.currentTrack = (this.currentTrack - 1 + this.musicTracks.length) % this.musicTracks.length
    this.loadTrack()
  }

  nextTrack() {
    this.currentTrack = (this.currentTrack + 1) % this.musicTracks.length
    this.loadTrack()
  }

  loadTrack() {
    if (this.audio && this.musicTracks[this.currentTrack]) {
      const track = this.musicTracks[this.currentTrack]
      this.audio.pause()
      this.audio.currentTime = 0
      this.audio.src = track.src
      this.audio.load()

      this.updateTrackInfo()
      setTimeout(() => {
        this.playMusic()
      }, 200)
    }
  }

  updateTrackInfo() {
    const track = this.musicTracks[this.currentTrack]
    const titleElement = document.getElementById("trackTitle")
    const artistElement = document.getElementById("trackArtist")

    if (titleElement) titleElement.textContent = track.title
    if (artistElement) artistElement.textContent = track.artist
  }

  updateMusicButtons() {
    const playBtn = document.getElementById("playBtn")
    const pauseBtn = document.getElementById("pauseBtn")

    if (this.isPlaying) {
      playBtn?.classList.remove("active")
      pauseBtn?.classList.add("active")
    } else {
      playBtn?.classList.add("active")
      pauseBtn?.classList.remove("active")
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted
    if (this.audio) {
      this.audio.muted = this.isMuted
    }
    this.updateVolumeDisplay()
  }

  setVolume(newVolume) {
    this.volume = newVolume
    this.isMuted = false
    if (this.audio) {
      this.audio.volume = this.volume
      this.audio.muted = false
    }
    this.updateVolumeDisplay()
  }

  updateVolumeDisplay() {
    const volumeText = document.getElementById("volumeText")
    const volumeSlider = document.getElementById("volumeSlider")
    const volumeBtn = document.getElementById("volumeBtn")

    const displayVolume = this.isMuted ? 0 : Math.round(this.volume * 100)

    if (volumeText) volumeText.textContent = `${displayVolume}%`
    if (volumeSlider) volumeSlider.value = this.isMuted ? 0 : this.volume * 100

    if (volumeBtn) {
      volumeBtn.innerHTML =
        this.isMuted || this.volume === 0
          ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>'
    }
  }

  // Modal functions
  openModal(type) {
    const modal = document.getElementById("modal")
    const modalTitle = document.getElementById("modalTitle")
    const modalContent = document.getElementById("modalContent")

    let title = ""
    let content = ""

    switch (type) {
      case "SERVER RULES":
        title = "SERVER RULES"
        content = this.getServerRulesContent()
        break
      case "OUR TEAM":
        title = "OUR TEAM"
        content = this.getTeamContent()
        break
      case "LATEST NEWS":
        title = "LATEST NEWS"
        content = this.getNewsContent()
        break
      case "RECENT UPDATES":
        title = "RECENT UPDATES"
        content = this.getUpdatesContent()
        break
    }

    modalTitle.textContent = title
    modalContent.innerHTML = content
    modal.classList.add("active")
  }

  closeModal() {
    const modal = document.getElementById("modal")
    modal.classList.remove("active")
  }

  getServerRulesContent() {
    return `
    <div class="modal-subtitle">SERVER GUIDELINES</div>
    <div class="rules-list">
      <div class="rule-item">
        <span class="rule-number">01</span>
        <span class="rule-text">Be respectful to others.</span>
      </div>
      <div class="rule-item">
        <span class="rule-number">02</span>
        <span class="rule-text">No cheating or exploiting bugs.</span>
      </div>
      <div class="rule-item">
        <span class="rule-number">03</span>
        <span class="rule-text">Follow staff instructions.</span>
      </div>
      <div class="rule-item">
        <span class="rule-number">04</span>
        <span class="rule-text">Use appropriate language.</span>
      </div>
      <div class="rule-item">
        <span class="rule-number">05</span>
        <span class="rule-text">No random killing (RDM).</span>
      </div>
      <div class="rule-item">
        <span class="rule-number">06</span>
        <span class="rule-text">Stay in character at all times.</span>
      </div>
    </div>
  `
  }

  getTeamContent() {
    return `
    <div class="modal-subtitle">ADMINISTRATION TEAM</div>
    <div class="team-list">
      <div class="team-member">
        <div class="member-role">Owner</div>
        <div class="member-name">Heaven Scripts</div>
      </div>
      <div class="team-member">
        <div class="member-role">Owner</div>
        <div class="member-name">Heaven Scripts</div>
      </div>
      <div class="team-member">
        <div class="member-role">Owner</div>
        <div class="member-name">Heaven Scripts</div>
      </div>
      <div class="team-member">
        <div class="member-role">Developer</div>
        <div class="member-name">Heaven Scripts</div>
      </div>
    </div>
  `
  }

  getNewsContent() {
    return `
    <div class="modal-subtitle">LATEST SERVER NEWS</div>
    <div class="news-list">
      <div class="news-item">
        <div class="news-date">January 15, 2024</div>
        <div class="news-title">Server Update v2.1</div>
        <div class="news-text">New vehicles and improved performance.</div>
      </div>
      <div class="news-item">
        <div class="news-date">January 10, 2024</div>
        <div class="news-title">New Business System</div>
        <div class="news-text">Players can now own and manage businesses.</div>
      </div>
      <div class="news-item">
        <div class="news-date">January 5, 2024</div>
        <div class="news-title">Holiday Event Ended</div>
        <div class="news-text">Thank you for participating in our holiday event!</div>
      </div>
    </div>
  `
  }

  getUpdatesContent() {
    return `
    <div class="modal-subtitle">RECENT UPDATES</div>
    <div class="updates-list">
      <div class="update-item">
        <div class="update-version">v2.1.3</div>
        <div class="update-changes">
          <div>• Fixed vehicle spawning issues</div>
          <div>• Improved server stability</div>
          <div>• Added new clothing options</div>
        </div>
      </div>
      <div class="update-item">
        <div class="update-version">v2.1.2</div>
        <div class="update-changes">
          <div>• Performance optimizations</div>
          <div>• Bug fixes for housing system</div>
            <div>• Updated economy balance</div>
          </div>
        </div>
      </div>
    `
  }

  fadeOut() {
    document.body.style.transition = "opacity 1s ease-out"
    document.body.style.opacity = "0"

    setTimeout(() => {
      if (window.invokeNative) {
        window.invokeNative("SHUTDOWN_LOADING_SCREEN")
        window.invokeNative("SET_NUI_FOCUS", false, false)
      }
    }, 1000)
  }
}

// INICIALIZACIJA - Več načinov za FiveM kompatibilnost

// Način 1: DOMContentLoaded (običajno)
document.addEventListener("DOMContentLoaded", () => {
  if (!window.loadingScreenInitialized) {
    window.loadingScreenInitialized = true
    new LoadingScreen()
  }
})

// Način 2: window.load (če DOMContentLoaded ne deluje)
window.addEventListener("load", () => {
  if (!window.loadingScreenInitialized) {
    window.loadingScreenInitialized = true
    new LoadingScreen()
  }
})

// Način 3: Zakasnjena inicializacija (FiveM backup)
setTimeout(() => {
  if (!window.loadingScreenInitialized) {
    window.loadingScreenInitialized = true
    new LoadingScreen()
  }
}, 2000)

// Način 4: Takojšnja inicializacija, če je DOM že pripravljen
if (document.readyState === "loading") {
} else {
  if (!window.loadingScreenInitialized) {
    window.loadingScreenInitialized = true
    new LoadingScreen()
  }
}

// DEBUG funkcija za testiranje videa
window.testVideo = () => {
  const video = document.querySelector("#backgroundVideo")
  if (video) {
  } else {
  }
}
