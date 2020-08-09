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
    $('.ui.auth.modal').modal({ closable: false,  blurring: true }).modal('show');
  }
  OPEN_BROADCAST_MODAL();
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
    $('#send_message').removeClass('loading');
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
    $('.ui.auth.modal').modal({ closable: false,  blurring: true }).modal('show');
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
      UPDATE_SENDER_CHAT(data.chat_data);
    } else if (CURRENT_USER_DATA.full_name === data.reciever.full_name){
      UPDATE_RECIEVER_CHAT(data.chat_data);
    }
  });

  socket.on('BROADCAST_SUCCESS', data => {
    var SESSION_KEY = sessionStorage.getItem("session_key");
    if (SESSION_KEY == data.session_key){
      NOTIFICATION('success', data.message, 'topCenter');
      $('#onlineuser').val('');
      $('#broadcast_message').val('');
      return;
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
  sessionStorage.setItem("online_users", JSON.stringify(data));
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
  $('.ui.auth.modal').modal({ closable: true,  blurring: true }).modal('hide');
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
            <a><i class="clock outline icon"></i>${moment(value.created_at).fromNow()}</a>
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

function UPDATE_RECIEVER_CHAT(CHAT_DATA){
  $(`
    <div class="comment">
      <a class="avatar">
        <img src="${CHAT_DATA.created_by.photo}">
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

function UPDATE_SENDER_CHAT(CHAT_DATA){
  $('#chat_message_inp').val('');

  $(`
    <div class="comment chat_align">
      <a class="avatar">
        <img src="${CHAT_DATA.created_by.photo}">
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

function OPEN_BROADCAST_MODAL(){
  $('#broadcast_button').on('click', function(){
    $('#online_user_list').html('');
    var CURRENT_USER_DATA = JSON.parse(sessionStorage.getItem("user_data"));
    var ONLINE_USERS = JSON.parse(sessionStorage.getItem("online_users"));
    $.each(ONLINE_USERS.filter(i => i.full_name !== CURRENT_USER_DATA.full_name), function (index, value) {
      $('#online_user_list').append(`
        <div class="item" data-value="${value.full_name}">
          ${value.full_name}
        </div>
      `);
    });
    $('#multi_dropdown').dropdown();
    $('.ui.broadcast.modal').modal('show');
  });
}

function BROADCAST_CHAT(){
  var INP_USERS = $('#onlineuser').val();
  var INP_MESSAGE = $('#broadcast_message').val();
  if (INP_MESSAGE === '' || INP_USERS === ''){
    NOTIFICATION('error', 'Please input a message and select users!', 'topCenter');
    return;
  }
  var SESSION_KEY = sessionStorage.getItem("session_key");
  var CURRENT_USER_DATA = JSON.parse(sessionStorage.getItem("user_data"));
  
  socket.emit('BROADCAST_MESSAGE', { 'session_key': SESSION_KEY, 'users_list': INP_USERS, 
    'full_name': CURRENT_USER_DATA.full_name, 'message': INP_MESSAGE });

  $('.ui.broadcast.modal').modal('hide');
}

function OPEN_DELETE_MODAL(){
  $('.ui.basic.modal').modal('show');
}

function DELETE_CHAT(){
  var TARGET_USER_DATA = JSON.parse(sessionStorage.getItem("target_user_data"));
  var CURRENT_USER_DATA = JSON.parse(sessionStorage.getItem("user_data"));
  var SESSION_KEY = sessionStorage.getItem("session_key");

  socket.emit('DELETE_MESSAGE', { 'session_key': SESSION_KEY, 'full_name': CURRENT_USER_DATA.full_name, 
    'target_user': TARGET_USER_DATA.full_name });
}