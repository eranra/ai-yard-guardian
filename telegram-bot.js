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
            parse_mode: 'HTML'
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
     * Send text message to user's Telegram chat
     */
    sendMessage: async function (text, parseMode = 'HTML') {
      if (!this.isConfigured() || !this.enabled) return false;

      try {
        const url = `https://api.telegram.org/bot${this.token}/sendMessage`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: this.chatId,
            text: text,
            parse_mode: parseMode
          })
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
      const cleanCmd = cmdText.split(' ')[0].toLowerCase().split('@')[0];
      const reply = (text) => this.sendMessage(text);
      const replyPhoto = (blob, caption) => this.sendPhotoBlob(blob, caption);

      switch (cleanCmd) {
        case '/help':
        case '/start':
          reply(
            '🤖 <b>AI Yard Guardian Remote Commands:</b>\n\n' +
            '📸 <code>/snap</code> - Take a live photo now\n' +
            '💦 <code>/spray</code> - Trigger water valve spray\n' +
            '📊 <code>/status</code> - Check armed status & targets\n' +
            '🛡️ <code>/arm</code> - Start AI detection\n' +
            '⏸️ <code>/disarm</code> - Pause AI detection\n' +
            '❓ <code>/help</code> - Show this menu'
          );
          break;

        case '/status':
        case '/snap':
        case '/photo':
        case '/spray':
        case '/arm':
        case '/disarm':
          if (this.callbacks.onCommand) {
            this.callbacks.onCommand(cleanCmd.replace('/', ''), reply, replyPhoto);
          }
          break;

        default:
          reply(`❓ Unknown command: <code>${cleanCmd}</code>\nType <code>/help</code> for available commands.`);
      }
    }
  };

  window.TelegramBot = TelegramBot;

})(window);
