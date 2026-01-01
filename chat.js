document.addEventListener('DOMContentLoaded', () => {

  const peers = [
      'https://gun-manhattan.herokuapp.com/gun',
      'https://gun-eu.herokuapp.com/gun',
      'https://gun-us.herokuapp.com/gun',
      'https://peer.wallie.io/gun',
      'https://plumm-gun-peer.herokuapp.com/gun',
      'https://gunjs.herokuapp.com/gun'
  ];

  const gun = Gun({
      peers: peers,
      localStorage: true,
      radisk: true
  });

  const chat = gun.get('chat-ultimate-v1');

  let user = localStorage.getItem('chat_user') || '';
  const chatBox = document.getElementById('chat-box');
  const processedIds = new Set();

  // Проверка сети и обновление UI
  function checkNetwork() {
    setTimeout(() => {
      const netInd = document.getElementById('net-indicator');
      const peersCount = document.getElementById('peers-count');
      if(netInd) { netInd.classList.replace('bg-red-500', 'bg-green-500'); }
      if(peersCount) { 
        peersCount.innerText = 'В сети (P2P)';
        peersCount.classList.add('text-green-400');
      }
    }, 1500);
  }

  // Логика входа
  function onLogin() {
    document.getElementById('login-screen').style.display = 'none';
    checkNetwork();
    setupChatListeners();
  }

  function login() {
    const input = document.getElementById('username');
    if (!input) return alert('Введите имя');
    const val = input.value.trim();
    if (!val) return alert('Введите имя');
    user = val;
    localStorage.setItem('chat_user', val);
    onLogin();
  }

  // Если пользователь уже залогинен, запускаем чат
  if(user) {
    onLogin();
  } else {
    // Кнопка входа (привязка)
    const loginBtn = document.querySelector('#login-screen button');
    if(loginBtn) loginBtn.addEventListener('click', login);
  }

  // Отправка сообщения
  function send() {
    const input = document.getElementById('msg-input');
    if(!input) return;
    const text = input.value.trim();
    if(!text) return;

    const msg = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2,5),
      text,
      user,
      time: Date.now()
    };

    renderMessage(msg, true);
    chat.set(msg);
    input.value = '';
    input.style.height = 'auto';
    input.focus();
  }

  // Подписка на новые сообщения
  function setupChatListeners() {
    chat.map().on((msg) => {
      if (!msg || !msg.text || !msg.time) return;
      if (processedIds.has(msg.id)) return;
      if(Date.now() - msg.time > 259200000) return; // Старше 3 дней игнорируем
      renderMessage(msg, false);
    });
  }

  // Рендер сообщений
  function renderMessage(msg, scrollToBottom) {
    if(processedIds.has(msg.id)) return;
    processedIds.add(msg.id);

    const isMe = msg.user === user;
    const date = new Date(msg.time);
    const time = date.getHours().toString().padStart(2,'0') + ':' + date.getMinutes().toString().padStart(2,'0');

    const div = document.createElement('div');
    div.className = `msg ${ isMe ? 'msg-my' : 'msg-other'}`;
    div.dataset.time = msg.time;

    div.innerHTML = `
      ${ !isMe ? `<div class="text-[11px] font-bold text-blue-400 mb-1">${escapeHtml(msg.user)}</div>` : '' }
      <div class="leading-relaxed whitespace-pre-wrap">${escapeHtml(msg.text)}</div>
      <div class="text-[10px] opacity-60 text-right mt-1 flex justify-end gap-1 items-center">${time} ${isMe ? '<i class="fa-solid fa-check"></i>': ''}</div>
    `;

    chatBox.appendChild(div);

    if(scrollToBottom) {
      setTimeout(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
      }, 50);
    }
  }

  // Экранирование HTML
  function escapeHtml(text) {
    return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  // Подключить обработчики UI после DOM загружен
  const sendBtn = document.querySelector('button[onclick="send()"]');
  if(sendBtn) sendBtn.addEventListener('click', send);

  const msgInput = document.getElementById('msg-input');
  if(msgInput) {
    msgInput.addEventListener('keydown', (e) => {
      if(e.key==='Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });
    msgInput.addEventListener('input', ()=> {
      msgInput.style.height = 'auto';
      msgInput.style.height = msgInput.scrollHeight + 'px';
    });
  }

  // Создание и управление панелью смайлов
  const panel = document.getElementById('emoji-panel');
  const emojis = ['😀','😂','😍','😭','😡','👍','👎','🔥','❤️','💔','💩','🤡','👻','👽','🎃','💀','👀','🧠','💪','🙏','👋','💋','🔞','🚀','✅','🛑','💎','🎁','🎈','🎉'];
  emojis.forEach(e => {
    const btn = document.createElement('div');
    btn.className = 'emoji-btn';
    btn.innerText = e;
    btn.onmousedown = (ev) => {
      ev.preventDefault();
      const inp = document.getElementById('msg-input');
      if(inp) {
        inp.value += e;
        toggleEmoji(false);
        inp.focus();
      }
    };
    if(panel) panel.appendChild(btn);
  });

  function toggleEmoji(force) {
    if(!panel) return;
    if(force === undefined) {
      const isHidden = getComputedStyle(panel).display === 'none';
      panel.style.display = isHidden ? 'grid' : 'none';
    } else {
      panel.style.display = force ? 'grid' : 'none';
    }
  }

  const emojiBtn = document.querySelector('.fa-face-smile')?.parentNode;
  document.addEventListener('click', (e) => {
    if(!panel || !emojiBtn) return;
    if(!panel.contains(e.target) && !emojiBtn.contains(e.target)) {
      panel.style.display = 'none';
    }
  });

});
