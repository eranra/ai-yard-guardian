/**
 * telegram-bot.js - Client-Side Telegram Bot Integration for AI Yard Guardian
 * 100% Serverless - Communicates directly with Telegram Bot API (api.telegram.org)
 * Features:
 *  - Instant intruder alert notifications
 *  - High-res photo snapshot upload (sendPhoto)
 *  - Two-way remote control commands (/status, /snap, /spray, /arm, /disarm)
 */

(function (window) {
  'use strict';

  const STORAGE_KEYS = {
    TOKEN: 'yard_guardian_tg_token',
    CHAT_ID: 'yard_guardian_tg_chat_id',
    ENABLED: 'yard_guardian_tg_enabled',
    REMOTE_ENABLED: 'yard_guardian_tg_remote_enabled'
  };

  const DEFAULT_KEYBOARD = {
    keyboard: [
      [{ text: '📸 Snapshot' }, { text: '💦 Spray Test' }],
      [{ text: '🛡️ Arm' }, { text: '⏸️ Disarm' }, { text: '🔦 Torch' }],
      [{ text: '🌙 Screen' }, { text: '📊 Status' }, { text: '⚙️ Config' }, { text: '🔄 Refresh' }]
    ],
    resize_keyboard: true,
    is_persistent: true
  };

  const TelegramBot = {
    token: '',
    chatId: '',
    enabled: false,
    remoteControlEnabled: true,
    isPolling: false,
    lastUpdateId: 0,
    pollingAbortController: null,
    callbacks: {},

    init: function (callbacks) {
      this.callbacks = callbacks || {};
      this.token = (localStorage.getItem(STORAGE_KEYS.TOKEN) || '').trim();
      this.chatId = (localStorage.getItem(STORAGE_KEYS.CHAT_ID) || '').trim();
      this.enabled = localStorage.getItem(STORAGE_KEYS.ENABLED) === 'true';
      this.remoteControlEnabled = localStorage.getItem(STORAGE_KEYS.REMOTE_ENABLED) !== 'false';
      return this.isConfigured();
    },

    isConfigured: function () {
      return !!(this.token && this.chatId);
    },

    saveCredentials: function (token, chatId, enabled, remoteEnabled) {
      this.token = (token || '').trim();
      this.chatId = (chatId || '').trim();
      this.enabled = !!enabled;
      this.remoteControlEnabled = remoteEnabled !== false;

      localStorage.setItem(STORAGE_KEYS.TOKEN, this.token);
      localStorage.setItem(STORAGE_KEYS.CHAT_ID, this.chatId);
      localStorage.setItem(STORAGE_KEYS.ENABLED, this.enabled ? 'true' : 'false');
      localStorage.setItem(STORAGE_KEYS.REMOTE_ENABLED, this.remoteControlEnabled ? 'true' : 'false');

      if (!this.enabled || !this.remoteControlEnabled) {
        this.stopPolling();
      }
    },

    getCredentials: function () {
      return {
        token: this.token,
        chatId: this.chatId,
        enabled: this.enabled,
        remoteControlEnabled: this.remoteControlEnabled
      };
    },

    /**
     * Send test message to verify Bot Token and Chat ID
     */
    testConnection: async function (testToken, testChatId) {
      const token = (testToken || this.token || '').trim();
      const chatId = (testChatId || this.chatId || '').trim();

      if (!token || !chatId) {
        return { ok: false, error: 'Bot Token and Chat ID are required.' };
      }

      try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: '🤖 <b>AI Yard Guardian Connected!</b>\n\nTelegram Bot alert and remote control integration is working properly.',
            parse_mode: 'HTML',
            reply_markup: DEFAULT_KEYBOARD
          })
        });

        const data = await res.json();
        if (data.ok) {
          return { ok: true, result: data.result };
        } else {
          return { ok: false, error: data.description || 'Telegram API rejected request' };
        }
      } catch (err) {
        return { ok: false, error: err.message || 'Network error communicating with api.telegram.org' };
      }
    },

    /**
     * Send text message to user's Telegram chat with optional custom keyboard
     */
    sendMessage: async function (text, parseMode = 'HTML', replyMarkup = undefined) {
      if (!this.isConfigured() || !this.enabled) return false;

      try {
        const url = `https://api.telegram.org/bot${this.token}/sendMessage`;
        const payload = {
          chat_id: this.chatId,
          text: text,
          parse_mode: parseMode
        };

        const markup = (replyMarkup !== undefined) ? replyMarkup : DEFAULT_KEYBOARD;
        if (markup) {
          payload.reply_markup = markup;
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        return data.ok;
      } catch (err) {
        console.warn('Telegram sendMessage failed:', err);
        return false;
      }
    },

    /**
     * Send formatted intruder alert message
     */
    sendIntruderAlert: async function (target, score, timeStr) {
      if (!this.isConfigured() || !this.enabled) return false;

      const pct = Math.round((score || 0) * 100);
      const text = `🚨 <b>INTRUDER ALERT!</b>\n` +
        `🎯 Detected: <b>${(target || 'Intruder').toUpperCase()}</b> (${pct}% confidence)\n` +
        `🕒 Time: <b>${timeStr || new Date().toLocaleTimeString()}</b>\n` +
        `🛡️ AI Yard Guardian has triggered deterrence.`;

      return this.sendMessage(text);
    },

    /**
     * Send captured snapshot photo blob directly to Telegram chat
     */
    sendPhotoBlob: async function (blob, caption = '') {
      if (!this.isConfigured() || !this.enabled || !blob) return false;

      try {
        const url = `https://api.telegram.org/bot${this.token}/sendPhoto`;
        const formData = new FormData();
        formData.append('chat_id', this.chatId);
        formData.append('caption', caption || '📸 Intruder Evidence Snapshot');
        formData.append('parse_mode', 'HTML');
        formData.append('photo', blob, 'intruder_snapshot.jpg');

        const res = await fetch(url, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        return data.ok;
      } catch (err) {
        console.warn('Telegram sendPhoto failed:', err);
        return false;
      }
    },

    /**
     * Send base64 dataUrl snapshot to Telegram
     */
    sendPhotoDataUrl: async function (dataUrl, caption = '') {
      if (!dataUrl || !this.isConfigured() || !this.enabled) return false;
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return this.sendPhotoBlob(blob, caption);
      } catch (err) {
        console.warn('Failed to convert dataUrl to blob for Telegram:', err);
        return false;
      }
    },

    /**
     * Start long-polling loop to listen for user remote commands in Telegram
     */
    startPolling: function () {
      if (this.isPolling) return;
      if (!this.isConfigured() || !this.enabled || !this.remoteControlEnabled) return;

      this.isPolling = true;
      this._pollLoop();
    },

    stopPolling: function () {
      this.isPolling = false;
      if (this.pollingAbortController) {
        try { this.pollingAbortController.abort(); } catch (e) {}
        this.pollingAbortController = null;
      }
    },

    _pollLoop: async function () {
      while (this.isPolling && this.enabled && this.remoteControlEnabled) {
        try {
          this.pollingAbortController = new AbortController();
          const url = `https://api.telegram.org/bot${this.token}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=5`;
          const res = await fetch(url, { signal: this.pollingAbortController.signal });
          const data = await res.json();

          if (data && data.ok && Array.isArray(data.result)) {
            for (const update of data.result) {
              this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
              if (update.message && update.message.text) {
                // Ensure message came from authorized chat
                const senderChatId = String(update.message.chat.id);
                if (senderChatId === String(this.chatId)) {
                  this._handleIncomingCommand(update.message.text.trim());
                }
              }
            }
          }
        } catch (err) {
          // If aborted due to stopPolling, break cleanly
          if (err.name === 'AbortError') break;
          // Small delay before retrying on network hiccup
          await new Promise(r => setTimeout(r, 4000));
        }

        // Slight breathing room between polling rounds
        await new Promise(r => setTimeout(r, 1000));
      }
    },

    _handleIncomingCommand: function (cmdText) {
      const trimmed = (cmdText || '').trim();
      let firstWord = trimmed.split(/\s+/)[0].toLowerCase().split('@')[0];

      // Map interactive button presses to canonical slash commands (only if not already a slash command)
      const lowerFull = trimmed.toLowerCase();
      if (!firstWord.startsWith('/')) {
        if (lowerFull.includes('snapshot') || lowerFull.includes('📸')) {
          firstWord = '/snap';
        } else if (lowerFull.includes('spray') || lowerFull.includes('💦')) {
          firstWord = '/spray';
        } else if (lowerFull.includes('disarm') || lowerFull.includes('⏸️')) {
          firstWord = '/disarm';
        } else if (lowerFull.includes('arm') || lowerFull.includes('🛡️')) {
          firstWord = '/arm';
        } else if (lowerFull.includes('torch') || lowerFull.includes('🔦')) {
          firstWord = '/torch';
        } else if (lowerFull.includes('screen') || lowerFull.includes('stealth') || lowerFull.includes('🌙')) {
          firstWord = '/screen';
        } else if (lowerFull.includes('rotate') || lowerFull.includes('orientation')) {
          firstWord = '/rotate';
        } else if (lowerFull.includes('status') || lowerFull.includes('📊')) {
          firstWord = '/status';
        } else if (lowerFull.includes('config') || lowerFull.includes('settings') || lowerFull.includes('⚙️')) {
          firstWord = '/config';
        } else if (lowerFull.includes('refresh') || lowerFull.includes('reload') || lowerFull.includes('🔄')) {
          firstWord = '/refresh';
        } else if (lowerFull.includes('help') || lowerFull.includes('menu') || lowerFull.includes('❓')) {
          firstWord = '/help';
        }
      }

      const cleanCmd = firstWord.startsWith('/') ? firstWord : ('/' + firstWord);
      const reply = (text, markup) => this.sendMessage(text, 'HTML', markup);
      const replyPhoto = (blob, caption) => this.sendPhotoBlob(blob, caption);
      const args = trimmed.split(/\s+/).slice(1);

      switch (cleanCmd) {
        case '/help':
        case '/start':
        case '/menu':
          reply(
            '🤖 <b>AI Yard Guardian Remote Menu</b>\n\n' +
            '<b>Quick Actions:</b>\n' +
            '📸 <code>/snap</code> — Take a live photo now\n' +
            '🔄 <code>/rotate</code> — Rotate camera 90° &amp; check snapshot\n' +
            '💦 <code>/spray</code> — Trigger water deterrent\n' +
            '🛡️ <code>/arm</code> — Start AI detection\n' +
            '⏸️ <code>/disarm</code> — Pause AI into standby\n' +
            '🌙 <code>/screen [on|off]</code> — OLED Blackout screen saver\n' +
            '🔦 <code>/torch [on|off]</code> — Toggle flashlight\n' +
            '📊 <code>/status</code> — Armed, battery & lighting status\n' +
            '🔄 <code>/refresh</code> — Reload app from GitHub\n\n' +
            '<b>Remote Configuration:</b>\n' +
            '⚙️ <code>/config</code> — View full configuration\n' +
            '📸 <code>/set autosnap &lt;on|off|5&gt;</code> (or <code>thresh 5</code>, <code>noise on|off|clear</code>) — Auto-snapshots\n' +
            '🔄 <code>/set rotate &lt;0|90|180|270&gt;</code> — Set camera angle\n' +
            '📷 <code>/set res &lt;vga|720p|1080p|max&gt;</code> — Camera resolution\n' +
            '⚡ <code>/set camfps &lt;5|10|15|30&gt;</code> — Sensor FPS (10 default)\n' +
            '🔍 <code>/set scanner &lt;horizon|2zone|off&gt;</code> — Deep yard scanner\n' +
            '🖼️ <code>/set scanner snap &lt;both|full|crop&gt;</code> — Snapshot detail mode\n' +
            '🌱 <code>/set speed &lt;eco|eco-fast|balanced|turbo&gt;</code> — CPU & battery mode\n' +
            '🔋 <code>/set screen &lt;1|2|5|off&gt;</code> — Screen timeout (mins)\n' +
            '🎚️ <code>/set day &lt;%&gt;</code> — Day sensitivity (e.g. <code>/set day 40</code>)\n' +
            '🌙 <code>/set night &lt;%&gt;</code> — Night sensitivity (e.g. <code>/set night 25</code>)\n' +
            '👤 <code>/set human &lt;%&gt;</code> — Human cutoff threshold (e.g. <code>/set human 50</code>)\n' +
            '🌓 <code>/set mode &lt;auto|day|night&gt;</code> — Light mode\n' +
            '🎯 <code>/set targets &lt;cat,dog,bird...&gt;</code> — Targets\n' +
            '⚡ <code>/set actions &lt;sprinklers,screenshot...&gt;</code> — Actions\n' +
            '📷 <code>/camera list</code> or <code>/camera &lt;num&gt;</code> — Switch lens\n' +
            '🔒 <code>/set safety &lt;on|off&gt;</code> — Human pause cutoff\n' +
            '🚀 <code>/set boost &lt;1-6|off&gt;</code> — AI Night shadow boost (1-6)\n' +
            '📷 <code>/set exposure &lt;on|off&gt;</code> — Camera exposure boost\n' +
            '🌙 <code>/set longexp &lt;auto|low|medium|high|off&gt;</code> — Night exposure mode\n' +
            '🔬 <code>/exposure</code> or <code>/camera exp</code> — Camera hardware exposure info\n' +
            '🔦 <code>/set torch_assist &lt;on|off&gt;</code> — Torch on alert\n' +
            '💧 <code>/set webhook &lt;url&gt;</code> — Update webhook URL\n\n' +
            '<i>Tip: Tap the buttons below your keyboard anytime!</i>'
          );
          break;

        case '/status':
        case '/snap':
        case '/photo':
        case '/rotate':
        case '/orientation':
        case '/spray':
        case '/arm':
        case '/disarm':
        case '/torch':
        case '/screen':
        case '/stealth':
        case '/config':
        case '/settings':
        case '/set':
        case '/target':
        case '/action':
        case '/camera':
        case '/exposure':
        case '/refresh':
        case '/reload':
        case '/update':
          if (this.callbacks.onCommand) {
            this.callbacks.onCommand(cleanCmd.replace('/', ''), reply, replyPhoto, args);
          }
          break;

        case '/autosnap':
        case '/autosnapshot':
          if (this.callbacks.onCommand) {
            this.callbacks.onCommand('set', reply, replyPhoto, ['autosnap', ...args]);
          }
          break;

        case '/res':
        case '/resolution':
          if (this.callbacks.onCommand) {
            this.callbacks.onCommand('set', reply, replyPhoto, ['res', ...args]);
          }
          break;

        case '/camfps':
          if (this.callbacks.onCommand) {
            this.callbacks.onCommand('set', reply, replyPhoto, ['camfps', ...args]);
          }
          break;

        case '/scanner':
          if (this.callbacks.onCommand) {
            this.callbacks.onCommand('set', reply, replyPhoto, ['scanner', ...args]);
          }
          break;

        case '/speed':
        case '/fps':
          if (this.callbacks.onCommand) {
            this.callbacks.onCommand('set', reply, replyPhoto, ['speed', ...args]);
          }
          break;

        default:
          reply(`❓ Unknown command: <code>${cleanCmd}</code>\nType <code>/help</code> or tap <b>📊 Status</b> below.`);
      }
    }
  };

  window.TelegramBot = TelegramBot;

})(window);
