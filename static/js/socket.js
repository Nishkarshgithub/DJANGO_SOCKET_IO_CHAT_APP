var IS_AUTHENTICATED = sessionStorage.getItem("is_Authenticated");
var SESSION_KEY = sessionStorage.getItem("session_key");

window.onunload = function(){
  LOGIN_FUNCTION();
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
    console.log(SESSION_KEY, typeof(SESSION_KEY));
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
          <div class="header">${value.full_name}</div>
        </div>
      </div>
    `);
  });
  $('#reload_list').removeClass('loading');
  $('.ui.modal').modal({ closable: true,  blurring: true }).modal('hide');
}


function RELOAD_ONLINE_USERLIST(){
  $('#reload_list').addClass('loading');
  var CURRENT_USER_DATA = JSON.parse(sessionStorage.getItem("user_data"));
  var SESSION_KEY = sessionStorage.getItem("session_key");
  socket.emit('USER_LIST', { 'session_key': SESSION_KEY, 'full_name': CURRENT_USER_DATA.full_name });
}

// socket.on('USER_DATA', userdata => {
//   $('#active_user_data').html('');
//   SHOW_USERS(userdata);
// });

// socket.on('MESSAGES_LIST', message => {
//   $('.chat_message').html('');
//   SHOW_MESSAGES(message);
// });

// function USER_DATA_HANDLER(){
//   socket.on('USER_ERROR', data => {
//     $('#error_value').text(data);
//     $('#name_error').show();
//   });

//   socket.on('NEW_USER_DATA', data => {
//     var USER_DATA = JSON.parse(localStorage.getItem('user_data'));
//     if (USER_DATA === null || USER_DATA.full_name === data.user_data['full_name']){
//       localStorage.setItem("is_Authenticated", data.is_Authenticated);
//       localStorage.setItem("user_data", JSON.stringify(data.user_data));
//       HOME_INTIALISATION();
//     }
//   });
// }

// function HOME_INTIALISATION(){
//   var USER_DATA = JSON.parse(localStorage.getItem('user_data'));
//   var Authenticated = localStorage.getItem("is_Authenticated");
//   if (USER_DATA === null || USER_DATA === undefined){
//     socket.emit('LIST_USER', null);
//   } else {
//     socket.emit('LIST_USER', USER_DATA);
//   }
//   switch (Authenticated) {
//     case 'true':
//       $('#login_wrap').html(
//         `<div class="form-group">
//           <label for="chatter_name"><i class="fa fa-user fa-fw" aria-hidden="true"></i> <span id="username">${USER_DATA.full_name}</span></label>
//         </div>`
//       );
//       break;
//     case null:
//       $('#login_wrap').html(
//         `<div class="form-group">
//           <input type="text" name="chatter_name" class="form-control" placeholder="Enter Your Name" id="chatter_name">
//           <hr>
//           <div id="name_error" style="display: none;">
//             <span id="error_value"></span>
//             <hr>
//           </div>
//           <button id="login" class="btn btn-sm" style="width: 100%;"><i class="fa fa-send fa-fw" aria-hidden="true"></i> <span>Start Chat</span></button>
//         </div>`
//       );
//       break;
//     default:
//       break;
//   }
//   $('.content').addClass('blur_div');
// }

// function CREATE_USER(){
//   $('#login').on('click', function(){
//     var NAME = $('#chatter_name').val();
//     if (NAME === '' || NAME === null){
//       $('#error_value').text('Name cannot be null!');
//       $('#name_error').show();
//     } else {
//       socket.emit('ADD_USER', NAME);
//     }
//   });
// }

// function SHOW_USERS(data){
//   $.each(data, function (index, value) {
//     $('#active_user_data').append(`
//       <li class="contact" key="${index}" onclick="LOAD_MESSAGES('${value.room_key}', '${value.full_name}')">
//         <div class="wrap">
//           <span class="contact-status ${value.is_logged ? 'online' : null}"></span>
//           <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/User_font_awesome.svg/1200px-User_font_awesome.svg.png" />
//           <div class="meta">
//             <p class="">${value.full_name} ${value.is_logged ? ' - online' : ' - offline'}</p>
//           </div>
//         </div>
//       </li>
//     `);
//   });
// }

// function LOAD_MESSAGES(TARGET_ROOM_KEY, TARGET_NAME){
//   $('.content').addClass('blur_div');
//   $('#TARGET_USERNAME').text(TARGET_NAME);
//   var USER_DATA = JSON.parse(localStorage.getItem('user_data'));
//   $('#room_key').val(USER_DATA.room_key + TARGET_ROOM_KEY);
//   socket.emit('FETCH_MESSAGES', {"ROOM_KEY": USER_DATA.room_key + TARGET_ROOM_KEY});
// }

// function SHOW_MESSAGES(MESSAGE){
//   $('#chat_message').html('');
//   $.each(MESSAGE, function (index, value) {
//     $('#chat_message').append(`
//       <li class="${value.message_type}" key="${index}">
//         <p>${value.message}</p>
//       </li>
//     `);
//   });
//   $('.content').removeClass('blur_div');
// }

// function SUBMIT_MESSAGE(){
//   $('#chat_submit').click(function() {
//     MESSAGE = $(".message-input input").val();
//     var TARGET_KEY = $('#room_key').val();
//     socket.emit('SEND_MESSAGE', {"room_key": TARGET_KEY, "message": MESSAGE});
//     if($.trim(MESSAGE) == '') {
//       return false;
//     }
//     $('<li class="sent"><p>' + MESSAGE + '</p></li>').appendTo($('.messages ul'));
//     $('.message-input input').val(null);
//     $('.contact.active .preview').html('<span>You: </span>' + MESSAGE);
//     $(".messages").animate({ scrollTop: $(document).height() }, "fast");
//   });
// }