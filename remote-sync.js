/**
 * remote-sync.js - AI Yard Guardian Local Wi-Fi Peer-to-Peer Sync
 * Enables dual-mode (Guardian & Viewer) operation with 100% serverless
 * WebRTC QR pairing over local home Wi-Fi.
 */

(function (window) {
  'use strict';

  // Configuration
  const RTC_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 2
  };

  const CHUNK_SIZE = 16384; // 16KB chunk size for safe binary/data transport

  const RemoteSync = {
    mode: 'guardian', // 'guardian' | 'viewer'
    peerConnection: null,
    dataChannel: null,
    isConnected: false,
    remoteStream: null,
    callbacks: {},
    incomingChunks: {},
    heartbeatInterval: null,
    lastHeartbeatPong: Date.now(),

    /**
     * Persistent Multi-Guardian Store (saved in localStorage on Viewer phone)
     */
    guardianStore: {
      STORAGE_KEY: 'yard_guardian_saved_guardians',
      ACTIVE_KEY: 'yard_guardian_active_id',

      getGuardians: function () {
        try {
          const raw = localStorage.getItem(this.STORAGE_KEY);
          return raw ? JSON.parse(raw) : [];
        } catch (e) {
          return [];
        }
      },

      saveGuardian: function (guardian) {
        const list = this.getGuardians();
        const id = guardian.id || ('guardian_' + Date.now().toString(36));
        const idx = list.findIndex(g => g.id === id);
        const item = Object.assign({
          id: id,
          name: guardian.name || ('Garden Camera ' + (list.length + 1)),
          addedAt: Date.now(),
          lastSeen: Date.now()
        }, guardian);

        if (idx >= 0) {
          list[idx] = Object.assign(list[idx], item, { lastSeen: Date.now() });
        } else {
          list.push(item);
        }
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
        if (!this.getActiveId()) {
          this.setActiveId(id);
        }
        return list;
      },

      renameGuardian: function (id, newName) {
        const list = this.getGuardians();
        const g = list.find(x => x.id === id);
        if (g && newName) {
          g.name = newName.trim();
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
        }
        return list;
      },

      removeGuardian: function (id) {
        let list = this.getGuardians();
        list = list.filter(x => x.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
        if (this.getActiveId() === id) {
          this.setActiveId(list.length > 0 ? list[0].id : null);
        }
        return list;
      },

      getActiveId: function () {
        const id = localStorage.getItem(this.ACTIVE_KEY);
        if (id) return id;
        const list = this.getGuardians();
        return list.length > 0 ? list[0].id : null;
      },

      setActiveId: function (id) {
        if (id) {
          localStorage.setItem(this.ACTIVE_KEY, id);
        } else {
          localStorage.removeItem(this.ACTIVE_KEY);
        }
      },

      getActiveGuardian: function () {
        const id = this.getActiveId();
        const list = this.getGuardians();
        return list.find(g => g.id === id) || (list[0] || null);
      }
    },

    /**
     * Start background heartbeat keep-alive
     */
    _startHeartbeat: function () {
      this._stopHeartbeat();
      this.lastHeartbeatPong = Date.now();
      this.heartbeatInterval = setInterval(() => {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
          try {
            this.dataChannel.send(JSON.stringify({ type: 'HEARTBEAT_PING', timestamp: Date.now() }));
          } catch (e) {}

          // Check if peer missed heartbeats (> 9 seconds)
          if (Date.now() - this.lastHeartbeatPong > 9000 && this.isConnected) {
            console.warn("Heartbeat missed. Triggering ICE recovery.");
            this._attemptAutoRecovery();
          }
        }
      }, 3000);
    },

    _stopHeartbeat: function () {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    },

    _attemptAutoRecovery: function () {
      if (!this.peerConnection) return;
      try {
        if (this.peerConnection.restartIce) {
          this.peerConnection.restartIce();
        }
      } catch (e) {
        console.warn("ICE restart error:", e);
      }
    },

    /**
     * Initialize RemoteSync with event listeners
     */
    init: function (callbacks) {
      this.callbacks = callbacks || {};
      const savedMode = localStorage.getItem('yard_guardian_mode');
      if (savedMode === 'viewer') {
        this.mode = 'viewer';
      } else {
        this.mode = 'guardian';
      }
      return this.mode;
    },

    setMode: function (mode) {
      this.mode = mode;
      localStorage.setItem('yard_guardian_mode', mode);
      if (this.callbacks.onModeChanged) {
        this.callbacks.onModeChanged(mode);
      }
    },

    /**
     * Ultra-compact SDP parameter extraction to produce big, chunky, easily-scanned QR codes.
     * Shrinks payload from ~2,000 chars down to ~150 chars.
     */
    compressSDP: function (desc) {
      try {
        const sdp = desc.sdp;
        const ufrag = (sdp.match(/a=ice-ufrag:([^\r\n]+)/) || [])[1] || '';
        const pwd = (sdp.match(/a=ice-pwd:([^\r\n]+)/) || [])[1] || '';
        const fpMatch = (sdp.match(/a=fingerprint:sha-256 ([^\r\n]+)/) || [])[1] || '';
        const fp = fpMatch.replace(/[^0-9a-fA-F]/g, '');

        // Extract host candidate(s)
        const candLines = sdp.match(/a=candidate:[^\r\n]+/g) || [];
        const candList = [];
        for (let cl of candLines) {
          if (cl.includes(' typ host ') && cl.includes(' udp ')) {
            const parts = cl.split(' ');
            if (parts[4] && parts[5] && !parts[4].includes(':') && !parts[4].endsWith('.local')) {
              candList.push(`${parts[4]}:${parts[5]}`);
            }
          }
        }
        // Fallback to any host candidate if IP was mDNS or obscure
        if (candList.length === 0) {
          for (let cl of candLines) {
            if (cl.includes(' typ host ')) {
              const parts = cl.split(' ');
              if (parts[4] && parts[5]) {
                candList.push(`${parts[4]}:${parts[5]}`);
                break;
              }
            }
          }
        }

        const payload = {
          t: desc.type === 'offer' ? 'o' : 'a',
          u: ufrag,
          p: pwd,
          f: fp,
          c: candList.slice(0, 2).join(',')
        };

        return 'AYG2:' + JSON.stringify(payload);
      } catch (err) {
        console.error("Compression error:", err);
        return JSON.stringify(desc);
      }
    },

    decompressSDP: function (str) {
      try {
        if (!str || typeof str !== 'string') return null;
        str = str.trim();

        // Extract code if user pasted a full URL (e.g. https://.../?pair=... or ?answer=...)
        if (str.includes('?pair=')) {
          const param = str.split('?pair=')[1].split('&')[0];
          str = decodeURIComponent(param);
        } else if (str.includes('?answer=')) {
          const param = str.split('?answer=')[1].split('&')[0];
          str = decodeURIComponent(param);
        } else if (str.startsWith('http://') || str.startsWith('https://')) {
          try {
            const url = new URL(str);
            const p = url.searchParams.get('pair') || url.searchParams.get('answer');
            if (p) str = decodeURIComponent(p);
          } catch (e) {}
        }

        if (str.startsWith('AYG2:')) {
          const payload = JSON.parse(str.slice(5));
          const isOffer = payload.t === 'o';
          const fpFormatted = (payload.f.match(/.{2}/g) || []).join(':');

          let candLines = '';
          if (payload.c) {
            const cands = payload.c.split(',');
            cands.forEach((cand, idx) => {
              if (cand.includes(':')) {
                const [ip, port] = cand.split(':');
                candLines += `a=candidate:${idx + 1} 1 udp 2122260223 ${ip} ${port} typ host generation 0\r\n`;
              }
            });
          }

          const rebuiltSdp = `v=0\r\n` +
            `o=- ${Date.now()} 2 IN IP4 127.0.0.1\r\n` +
            `s=-\r\n` +
            `t=0 0\r\n` +
            `a=group:BUNDLE 0 1\r\n` +
            `a=msid-semantic: WMS\r\n` +
            `m=video 9 UDP/TLS/RTP/SAVPF 96\r\n` +
            `c=IN IP4 0.0.0.0\r\n` +
            `a=rtcp:9 IN IP4 0.0.0.0\r\n` +
            `a=ice-ufrag:${payload.u}\r\n` +
            `a=ice-pwd:${payload.p}\r\n` +
            `a=fingerprint:sha-256 ${fpFormatted}\r\n` +
            `a=setup:${isOffer ? 'actpass' : 'active'}\r\n` +
            `a=mid:0\r\n` +
            `a=${isOffer ? 'sendonly' : 'recvonly'}\r\n` +
            `a=rtcp-mux\r\n` +
            `a=rtcp-rsize\r\n` +
            `a=rtpmap:96 VP8/90000\r\n` +
            candLines +
            `m=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\n` +
            `c=IN IP4 0.0.0.0\r\n` +
            `a=ice-ufrag:${payload.u}\r\n` +
            `a=ice-pwd:${payload.p}\r\n` +
            `a=fingerprint:sha-256 ${fpFormatted}\r\n` +
            `a=setup:${isOffer ? 'actpass' : 'active'}\r\n` +
            `a=mid:1\r\n` +
            `a=sctp-port:5000\r\n` +
            candLines;

          return {
            type: isOffer ? 'offer' : 'answer',
            sdp: rebuiltSdp
          };
        }

        // Backward compatibility for AYG:
        if (str.startsWith('AYG:')) {
          const raw = str.slice(4);
          let json = window.LZString ? window.LZString.decompressFromEncodedURIComponent(raw) : atob(raw);
          const parsed = JSON.parse(json);
          return {
            type: parsed.t === 'o' ? 'offer' : 'answer',
            sdp: parsed.s
          };
        }

        return JSON.parse(str);
      } catch (err) {
        console.error("Decompression error:", err);
        return null;
      }
    },

    /**
     * Clean up existing peer connection
     */
    closeConnection: function () {
      this._stopHeartbeat();
      if (this.dataChannel) {
        try { this.dataChannel.close(); } catch (e) {}
        this.dataChannel = null;
      }
      if (this.peerConnection) {
        try { this.peerConnection.close(); } catch (e) {}
        this.peerConnection = null;
      }
      this.isConnected = false;
      this.remoteStream = null;
      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(false);
      }
    },

    /**
     * GUARDIAN (HOST) FLOW:
     * Generates Offer QR with local media stream and data channel.
     */
    startHostOffer: function (localMediaStream, onOfferReady, onError) {
      this.closeConnection();
      try {
        const pc = new RTCPeerConnection(RTC_CONFIG);
        this.peerConnection = pc;

        // Add local video & audio tracks
        if (localMediaStream) {
          localMediaStream.getTracks().forEach(track => {
            pc.addTrack(track, localMediaStream);
          });
        }

        // Create DataChannel for two-way control & sync
        const dc = pc.createDataChannel('yard-control', { ordered: true });
        this._setupDataChannel(dc);

        this._setupPeerEvents(pc);

        pc.createOffer({
          offerToReceiveAudio: false,
          offerToReceiveVideo: false
        }).then(offer => {
          return pc.setLocalDescription(offer);
        }).then(() => {
          // Wait for local ICE gathering to complete before generating final QR
          this._waitForIceGathering(pc, () => {
            const compressed = this.compressSDP(pc.localDescription);
            if (onOfferReady) onOfferReady(compressed);
          });
        }).catch(err => {
          console.error("Offer creation failed:", err);
          if (onError) onError(err);
        });

      } catch (err) {
        if (onError) onError(err);
      }
    },

    /**
     * GUARDIAN (HOST) FLOW:
     * Accepts Answer from Viewer (scanned via QR)
     */
    acceptAnswer: function (compressedAnswer, onSuccess, onError) {
      if (!this.peerConnection) {
        if (onError) onError(new Error("No active peer connection on Guardian"));
        return;
      }
      try {
        const answer = this.decompressSDP(compressedAnswer);
        if (!answer || answer.type !== 'answer') {
          throw new Error("Invalid Answer format");
        }
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
          .then(() => {
            if (onSuccess) onSuccess();
          })
          .catch(err => {
            console.error("Failed to set remote answer:", err);
            if (onError) onError(err);
          });
      } catch (err) {
        if (onError) onError(err);
      }
    },

    /**
     * VIEWER (CLIENT) FLOW:
     * Accepts Offer from Guardian, creates Answer QR
     */
    createViewerAnswer: function (compressedOffer, onAnswerReady, onError) {
      this.closeConnection();
      try {
        const offer = this.decompressSDP(compressedOffer);
        if (!offer || offer.type !== 'offer') {
          throw new Error("Invalid Offer format");
        }

        const pc = new RTCPeerConnection(RTC_CONFIG);
        this.peerConnection = pc;

        // Setup remote stream receiving
        this.remoteStream = new MediaStream();
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            this.remoteStream = event.streams[0];
          } else {
            this.remoteStream.addTrack(event.track);
          }
          if (this.callbacks.onRemoteStream) {
            this.callbacks.onRemoteStream(this.remoteStream);
          }
        };

        // Catch incoming DataChannel from Host
        pc.ondatachannel = (event) => {
          this._setupDataChannel(event.channel);
        };

        this._setupPeerEvents(pc);

        pc.setRemoteDescription(new RTCSessionDescription(offer))
          .then(() => {
            return pc.createAnswer();
          })
          .then(answer => {
            return pc.setLocalDescription(answer);
          })
          .then(() => {
            this._waitForIceGathering(pc, () => {
              const compressed = this.compressSDP(pc.localDescription);
              if (onAnswerReady) onAnswerReady(compressed);
            });
          })
          .catch(err => {
            console.error("Answer creation failed:", err);
            if (onError) onError(err);
          });

      } catch (err) {
        if (onError) onError(err);
      }
    },

    _waitForIceGathering: function (pc, callback) {
      if (pc.iceGatheringState === 'complete') {
        callback();
        return;
      }
      let timeout = null;
      const checkState = () => {
        if (pc.iceGatheringState === 'complete') {
          pc.removeEventListener('icegatheringstatechange', checkState);
          if (timeout) clearTimeout(timeout);
          callback();
        }
      };
      pc.addEventListener('icegatheringstatechange', checkState);
      // Fallback timeout in case some candidate gathering hangs
      timeout = setTimeout(() => {
        pc.removeEventListener('icegatheringstatechange', checkState);
        callback();
      }, 1200);
    },

    _setupPeerEvents: function (pc) {
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        this.isConnected = (state === 'connected');
        if (this.callbacks.onConnectionChange) {
          this.callbacks.onConnectionChange(this.isConnected, state);
        }
      };
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          this.isConnected = true;
          if (this.callbacks.onConnectionChange) {
            this.callbacks.onConnectionChange(true, 'connected');
          }
        } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          this.isConnected = false;
          if (this.callbacks.onConnectionChange) {
            this.callbacks.onConnectionChange(false, pc.iceConnectionState);
          }
        }
      };
    },

    _setupDataChannel: function (dc) {
      this.dataChannel = dc;
      dc.onopen = () => {
        this.isConnected = true;
        this._startHeartbeat();
        if (this.callbacks.onConnectionChange) {
          this.callbacks.onConnectionChange(true, 'connected');
        }
        // If Guardian, immediately push initial settings to Viewer
        if (this.mode === 'guardian' && this.callbacks.onHostReadyToSync) {
          this.callbacks.onHostReadyToSync();
        }
      };
      dc.onclose = () => {
        this.isConnected = false;
        this._stopHeartbeat();
        if (this.callbacks.onConnectionChange) {
          this.callbacks.onConnectionChange(false, 'closed');
        }
      };
      dc.onerror = (err) => {
        console.error("DataChannel error:", err);
      };
      dc.onmessage = (event) => {
        this._handleDataMessage(event.data);
      };
    },

    _handleDataMessage: function (dataStr) {
      try {
        const msg = JSON.parse(dataStr);

        // Check if message is a chunked transmission
        if (msg._chunked) {
          const { id, index, total, chunk } = msg;
          if (!this.incomingChunks[id]) {
            this.incomingChunks[id] = [];
          }
          this.incomingChunks[id][index] = chunk;
          if (this.incomingChunks[id].filter(Boolean).length === total) {
            const assembled = this.incomingChunks[id].join('');
            delete this.incomingChunks[id];
            this._dispatchMessage(JSON.parse(assembled));
          }
          return;
        }

        this._dispatchMessage(msg);
      } catch (err) {
        console.error("Failed to parse data channel message:", err);
      }
    },

    _dispatchMessage: function (msg) {
      switch (msg.type) {
        case 'HEARTBEAT_PING':
          if (this.dataChannel && this.dataChannel.readyState === 'open') {
            try { this.dataChannel.send(JSON.stringify({ type: 'HEARTBEAT_PONG', timestamp: Date.now() })); } catch (e) {}
          }
          break;
        case 'HEARTBEAT_PONG':
          this.lastHeartbeatPong = Date.now();
          break;
        case 'SYNC_SETTINGS':
          if (this.callbacks.onSettingsSynced) {
            this.callbacks.onSettingsSynced(msg.data);
          }
          break;
        case 'REMOTE_COMMAND':
          if (this.callbacks.onRemoteCommand) {
            this.callbacks.onRemoteCommand(msg.command, msg.payload);
          }
          break;
        case 'DETECTION_ALERT':
          if (this.callbacks.onDetectionAlert) {
            this.callbacks.onDetectionAlert(msg.data);
          }
          break;
        case 'SNAPSHOT_BROADCAST':
          if (this.callbacks.onSnapshotBroadcast) {
            this.callbacks.onSnapshotBroadcast(msg.data);
          }
          break;
        default:
          console.log("Unknown remote message:", msg);
      }
    },

    /**
     * Send message across WebRTC DataChannel (with auto-chunking for large images)
     */
    send: function (type, data) {
      if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
        return false;
      }
      try {
        const payload = JSON.stringify({ type: type, data: data });
        if (payload.length <= CHUNK_SIZE) {
          this.dataChannel.send(payload);
        } else {
          // Split into chunked envelopes
          const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
          const totalChunks = Math.ceil(payload.length / CHUNK_SIZE);
          for (let i = 0; i < totalChunks; i++) {
            const chunkSlice = payload.substr(i * CHUNK_SIZE, CHUNK_SIZE);
            const chunkEnvelope = JSON.stringify({
              _chunked: true,
              id: msgId,
              index: i,
              total: totalChunks,
              chunk: chunkSlice
            });
            this.dataChannel.send(chunkEnvelope);
          }
        }
        return true;
      } catch (err) {
        console.error("Failed to send across DataChannel:", err);
        return false;
      }
    },

    /**
     * Helper to render a QR Code into a DOM container
     */
    renderQRCode: function (container, text, size) {
      if (!container) return;
      container.innerHTML = '';
      if (!window.QRCode) {
        container.innerText = "Error: QRCode library not loaded";
        return;
      }
      new window.QRCode(container, {
        text: text,
        width: size || 160,
        height: size || 160,
        colorDark: '#0f172a',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.L
      });
    },

    /**
     * Triple-Engine High Performance QR Scanner:
     * 1. ZXing BrowserQRCodeReader (adaptive hybrid binarization, anti-glare, perspective correction)
     * 2. Native hardware-accelerated BarcodeDetector (Chrome/Android ML Kit)
     * 3. Center-cropped jsQR with attemptBoth (fast 480x480 square matching user viewfinder)
     */
    startQRScanner: function (videoEl, canvasEl, onFoundCallback) {
      let scanning = true;
      let zxingReader = null;
      let barcodeDetector = null;

      function isValidPayload(raw) {
        if (!raw || typeof raw !== 'string') return false;
        const s = raw.trim();
        return s.startsWith('AYG2:') || s.startsWith('AYG:') || s.includes('?pair=') || s.includes('?answer=') || s.startsWith('{"') || s.includes('"type"');
      }

      function handleFound(data) {
        if (!scanning) return;
        scanning = false;
        if (zxingReader) {
          try { zxingReader.reset(); } catch (e) {}
        }
        if (onFoundCallback) onFoundCallback(data);
      }

      // 1. ZXing BrowserQRCodeReader
      if (window.ZXing && window.ZXing.BrowserQRCodeReader) {
        try {
          zxingReader = new window.ZXing.BrowserQRCodeReader();
          zxingReader.decodeFromVideoElementContinuously(videoEl, (result, err) => {
            if (!scanning) return;
            if (result && result.getText()) {
              const text = result.getText();
              if (isValidPayload(text)) {
                handleFound(text);
              }
            }
          });
        } catch (e) {
          console.warn("ZXing init error:", e);
        }
      }

      // 2. Native BarcodeDetector (Chrome/Android ML Kit)
      if ('BarcodeDetector' in window) {
        try {
          barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        } catch (e) {
          barcodeDetector = null;
        }
      }

      // 3. Center-Cropped jsQR loop (zoomed to user viewfinder, 4x faster)
      const ctx = canvasEl ? canvasEl.getContext('2d', { willReadFrequently: true }) : null;

      const scanFrame = async () => {
        if (!scanning) return;

        if (videoEl.readyState >= videoEl.HAVE_CURRENT_DATA) {
          // Native BarcodeDetector check
          if (barcodeDetector) {
            try {
              const barcodes = await barcodeDetector.detect(videoEl);
              if (barcodes && barcodes.length > 0) {
                for (let b of barcodes) {
                  if (isValidPayload(b.rawValue)) {
                    handleFound(b.rawValue);
                    return;
                  }
                }
              }
            } catch (err) {}
          }

          // Center-Cropped jsQR
          if (scanning && window.jsQR && canvasEl && ctx) {
            const vw = videoEl.videoWidth || 640;
            const vh = videoEl.videoHeight || 480;
            const cropSize = Math.min(vw, vh);
            const sx = (vw - cropSize) / 2;
            const sy = (vh - cropSize) / 2;
            
            // Downscale to 480x480 max for instant 15ms decoding
            const targetDim = Math.min(cropSize, 480);
            canvasEl.width = targetDim;
            canvasEl.height = targetDim;
            ctx.drawImage(videoEl, sx, sy, cropSize, cropSize, 0, 0, targetDim, targetDim);
            
            const imageData = ctx.getImageData(0, 0, targetDim, targetDim);
            const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "attemptBoth"
            });
            if (code && code.data && isValidPayload(code.data)) {
              handleFound(code.data);
              return;
            }
          }
        }

        if (scanning) {
          requestAnimationFrame(scanFrame);
        }
      };

      requestAnimationFrame(scanFrame);

      return {
        stop: function () {
          scanning = false;
          if (zxingReader) {
            try { zxingReader.reset(); } catch (e) {}
          }
        }
      };
    }
  };

  window.RemoteSync = RemoteSync;

})(window);
