var IS_AUTHENTICATED = sessionStorage.getItem("is_Authenticated");
var SESSION_KEY = sessionStorage.getItem("session_key");

window.onunload = function(){
  LOGOUT_FUNCTION();
  sessionStorage.clear();
}

$(document).ready(function(){
  SOCKET_CONNECT();
  var IS_AUTHENTICATED = sessionStorage.getItem("is_Authenticated");
  if (IS_AUTHENTICATED != 'true'){
    $('.ui.modal').modal({ closable: false,  blurring: true }).modal('show');
  }
});

function NOTIFICATION(TYPE, MESSAGE, POSITION){
  new Noty({
    type: TYPE,
    text: MESSAGE,
    layout: POSITION,
    theme: 'mint',
    timeout: ( true, 5000 )
  }).show();
}

function SOCKET_CONNECT(){
  socket = io(location.origin); 
  
  socket.on('connection', data => {
    var SESSION_KEY = sessionStorage.getItem("session_key");
    if (SESSION_KEY == 'null' || SESSION_KEY == null){
      sessionStorage.setItem('session_key', data.session_key);
      console.log('message: ' + data.message);
      NOTIFICATION('success', data.message, 'topRight');
    }
  });
  
  socket.on('disconnect', data => {
    var SESSION_KEY = sessionStorage.getItem("session_key");
    if (SESSION_KEY == data.session_key){
      sessionStorage.clear();
      console.log('message: ' + data.message);
      NOTIFICATION('error', data.message, 'topRight');
    }
  });
  
  socket.on('USER_ERROR', data => {
    $('#reload_list').addClass('loading');
    var SESSION_KEY = sessionStorage.getItem("session_key");
    if (SESSION_KEY === data.session_key){
      NOTIFICATION('error', data.message, 'topCenter');
    }
  });

  socket.on('LOGIN_SUCCESS', data => {
    var SESSION_KEY = sessionStorage.getItem("session_key");
    if (SESSION_KEY != data.session_key){
      return;
    }
    sessionStorage.setItem("is_Authenticated", true);
    sessionStorage.setItem("user_data", JSON.stringify(data.user_data));
    $('#username').text(data.user_data.full_name);
    socket.emit('USER_LIST', { 'session_key': SESSION_KEY, 'full_name': data.user_data.full_name });
  });

  socket.on('ONLINE_USERS', data => {
    ONLINE_LIST_USER(data.users_list);
  });

  socket.on('LOGOUT_SUCCESS', data => {
    var SESSION_KEY = sessionStorage.getItem("session_key");
    if (SESSION_KEY != data.session_key){
      return;
    }
    sessionStorage.clear();
    $('.ui.modal').modal({ closable: false,  blurring: true }).modal('show');
    location.reload();
  });

  socket.on('USER_CHAT_DATA', data => {
    var SESSION_KEY = sessionStorage.getItem("session_key");
    if (SESSION_KEY != data.session_key){
      return;
    }
    SET_CHAT_DATA(data.chat_data, data.target_user);
  });

  socket.on('NEW_CHAT_DATA', data => {
    var CURRENT_USER_DATA = JSON.parse(sessionStorage.getItem("user_data"));
    if (CURRENT_USER_DATA.full_name === data.sender.full_name){
      UPDATE_SENDER_CHAT(data.chat_data, data.sender);
    } else if (CURRENT_USER_DATA.full_name === data.reciever.full_name){
      UPDATE_RECIEVER_CHAT(data.chat_data, data.reciever);
    }
  });
}

// Login Function
function LOGIN_FUNCTION(){
  var username = $('#login_username').val();
  if (username == '' || username == null){
    $('#log_inp_errval').text('left blank').show();
    return;
  }
  var SESSION_KEY = sessionStorage.getItem("session_key");
  if (SESSION_KEY == null){
    NOTIFICATION('error', 'Session key is not assigned! Server Error.', 'topCenter');
    return;
  }
  socket.emit('LOGIN_COMMAND', { "session_key": SESSION_KEY, "full_name": username });
}

// Login Function
function LOGOUT_FUNCTION(){
  var CURRENT_USER_DATA = JSON.parse(sessionStorage.getItem("user_data"));
  var SESSION_KEY = sessionStorage.getItem("session_key");
  socket.emit('LOGOUT_COMMAND', { "session_key": SESSION_KEY, "full_name": CURRENT_USER_DATA.full_name });
}

// Register function
function REGISTER_FUNCTION(){
  var username = $('#register_username').val();
  if (username == '' || username == null){
    $('#reg_inp_errval').text('left blank').show();
    return;
  }
  var SESSION_KEY = sessionStorage.getItem("session_key");
  if (SESSION_KEY == null){
    NOTIFICATION('error', 'Session key is not assigned! Server Error.', 'topCenter');
    return;
  }
  socket.emit('REGISTER_COMMAND', { "session_key": SESSION_KEY, "full_name": username });
}

// Map users to online list
function ONLINE_LIST_USER(data){
  var CURRENT_USER_DATA = JSON.parse(sessionStorage.getItem("user_data"));
  $('#online_users').html('');
  $.each(data.filter(i => i.full_name !== CURRENT_USER_DATA.full_name), function (index, value) {
    $('#online_users').append(`
      <div class="item" key='${index}'>
          <img class="ui avatar image" src="${value.photo}">
          <div class="content">
            <a href='#' onclick='FETCH_CHAT_DATA("${value.full_name}")'> 
              <div class="header">${value.full_name}</div>
            </a>
          </div>
      </div>
    `);
  });
  $('#reload_list').removeClass('loading');
  $('.ui.modal').modal({ closable: true,  blurring: true }).modal('hide');
}

function FETCH_CHAT_DATA(TARGET_NAME){
  var CURRENT_USER_DATA = JSON.parse(sessionStorage.getItem("user_data"));
  var SESSION_KEY = sessionStorage.getItem("session_key");
  socket.emit('FETCH_CHAT_DATA', { 'session_key': SESSION_KEY, 'full_name': CURRENT_USER_DATA.full_name, 'target_name': TARGET_NAME });
}

function RELOAD_ONLINE_USERLIST(){
  $('#reload_list').addClass('loading');
  var CURRENT_USER_DATA = JSON.parse(sessionStorage.getItem("user_data"));
  var SESSION_KEY = sessionStorage.getItem("session_key");
  socket.emit('USER_LIST', { 'session_key': SESSION_KEY, 'full_name': CURRENT_USER_DATA.full_name });
}

function SET_CHAT_DATA(CHAT_DATA, TARGET_USER){
  $('#chat_data').html('');
  sessionStorage.setItem("target_user_data", JSON.stringify(TARGET_USER));

  $('#chat_user_data').html(`
    <div class="item">
      <a class="ui tiny circular image">
        <img src="${TARGET_USER.photo}">
      </a>
      <div class="middle aligned content">
        <div class="header">
          <i class="yellow circle icon"></i>
          ${TARGET_USER.full_name}
        </div>
      </div>
    </div>
  `);

  $.each(CHAT_DATA, function (index, value) {
    $('#chat_data').append(`
      <div class="comment ${value.created_by.full_name === TARGET_USER.full_name ? '' : 'chat_align'}" key="${index}">
        <a class="avatar">
          <img src="${value.created_for.full_name === TARGET_USER.full_name || value.created_by.full_name === TARGET_USER.full_name ? value.created_by.photo : value.created_for.photo}">
        </a>
        <div class="content">
          <div class="text">${value.message}</div>
          <div class="actions">
            <a class="reply">${moment(value.created_at).fromNow()}</a>
          </div>
        </div>
      </div>
    `);
  });

  $('#chat_area').removeClass('blur_container');
  $('#blur_no_content').hide();
}


function SEND_SECRET_MESSAGE(){
  var INP_MESSAGE = $('#chat_message_inp').val();
  if (INP_MESSAGE === ''){
    NOTIFICATION('error', 'Please input a message!', 'topCenter');
    return;
  }
  var TARGET_USER_DATA = JSON.parse(sessionStorage.getItem("target_user_data"));
  var CURRENT_USER_DATA = JSON.parse(sessionStorage.getItem("user_data"));
  var SESSION_KEY = sessionStorage.getItem("session_key");

  $('#send_message').addClass('loading');

  socket.emit('SEND_NEW_MESSAGE', { 'session_key': SESSION_KEY, 'message' : INP_MESSAGE,
  'full_name': CURRENT_USER_DATA.full_name, 'target_user': TARGET_USER_DATA.full_name });
}

function UPDATE_RECIEVER_CHAT(CHAT_DATA, USER_DATA){
  $(`
    <div class="comment">
      <a class="avatar">
        <img src="${CHAT_DATA.created_for.photo}">
      </a>
      <div class="content">
        <div class="text">${CHAT_DATA.message}</div>
        <div class="actions">
          <a class="reply">${moment(CHAT_DATA.created_at).fromNow()}</a>
        </div>
      </div>
    </div>
  `).appendTo($('#chat_data'));
}

function UPDATE_SENDER_CHAT(CHAT_DATA, USER_DATA){
  $('#chat_message_inp').val('');

  $(`
    <div class="comment chat_align">
      <a class="avatar">
        <img src="${USER_DATA.photo}">
      </a>
      <div class="content">
        <div class="text">${CHAT_DATA.message}</div>
        <div class="actions">
          <a class="reply">${moment(CHAT_DATA.created_at).fromNow()}</a>
        </div>
      </div>
    </div>
  `).appendTo($('#chat_data'));

  $('#send_message').removeClass('loading');
}