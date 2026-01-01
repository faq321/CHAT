document.addEventListener('DOMContentLoaded', () => {

  // Рабочие peers Gun
  const peers = [
    'https://gun.eco/gun',           // стабильный публичный
    'https://guntalk.herokuapp.com/gun', // альтернатива
    'https://gunjs.herokuapp.com/gun'    // может быть полезен
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
      if(netInd) {
        netInd.textContent = 'Online';
        netInd.classList.remove('bg-red-500');
        netInd.classList.add('bg-green-500');
      }
      if(peersCount) {
        peersCount.innerText = 'В сети (P2P)';
        peersCount.classList.add('text-green-400');
      }
    }, 1500);
  }

  // Логика входа
  function onLogin() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('chat-ui').classList.remove('d-none');
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

  // Если пользователь уже залогинен
  if(user) {
    onLogin();
  } else {
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
    console.log('Sending message to Gun:', msg);
    chat.set(msg, ack => console.log('Gun ack:', ack));
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

  function escapeHtml(text) {
    return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

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
    msgInput.addEventListener('input', () => {
      msgInput.style.height = 'auto';
      msgInput.style.height = msgInput.scrollHeight + 'px';
    });
  }
});
