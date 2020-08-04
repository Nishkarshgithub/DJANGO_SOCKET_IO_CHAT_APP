$(document).ready(function(){
  SOCKET_CONNECT();
  HOME_INTIALISATION();
  CREATE_USER();
  USER_DATA_HANDLER();
});

function SOCKET_CONNECT(){
  socket = io(location.origin);

  socket.on('connection', message => {
    console.log('message: ' + message);
  });
  
  socket.on('USER_DATA', userdata => {
    $('#active_user_data').html('');
    SHOW_USERS(userdata);
  });

  socket.on('RECIEVE_MESSAGE', message => {
    $('.chat_message').html('');
    SHOW_MESSAGES(message);
  });
}

function USER_DATA_HANDLER(){
  socket.on('USER_ERROR', data => {
    $('#error_value').text(data);
    $('#name_error').show();
  });

  socket.on('NEW_USER_DATA', data => {
    localStorage.setItem("is_Authenticated", data.is_Authenticated);
    localStorage.setItem("user_data", JSON.stringify(data.user_data));
    HOME_INTIALISATION();
  });
}

function HOME_INTIALISATION(){
  var USER_DATA = JSON.parse(localStorage.getItem('user_data'));
  var Authenticated = localStorage.getItem("is_Authenticated");
  if (USER_DATA === null || USER_DATA === undefined){
    socket.emit('LIST_USER', null);
  } else {
    socket.emit('LIST_USER', USER_DATA);
  }
  switch (Authenticated) {
    case 'true':
      $('#login_wrap').html(
        `<div class="form-group">
          <label for="chatter_name"><i class="fa fa-user fa-fw" aria-hidden="true"></i> <span id="username">${USER_DATA.full_name}</span></label>
        </div>`
      );
      break;
    case null:
      $('#login_wrap').html(
        `<div class="form-group">
          <input type="text" name="chatter_name" class="form-control" placeholder="Enter Your Name" id="chatter_name">
          <hr>
          <div id="name_error" style="display: none;">
            <span id="error_value"></span>
            <hr>
          </div>
          <button id="login" onclick="CREATE_USER()" class="btn btn-sm" style="width: 100%;"><i class="fa fa-send fa-fw" aria-hidden="true"></i> <span>Start Chat</span></button>
        </div>`
      );
      break;
    default:
      break;
  }
  $('.content').addClass('blur_div');
}

function CREATE_USER(){
  $('#login').on('click', function(){
    var NAME = $('#chatter_name').val();
    if (NAME === '' || NAME === null){
      $('#error_value').text('Name cannot be null!');
      $('#name_error').show();
    } else {
      socket.emit('ADD_USER', NAME);
    }
  });
}

function SHOW_USERS(data){
  $.each(data, function (index, value) {
    $('#active_user_data').append(`
      <li class="contact" key="${index}" onclick="LOAD_MESSAGES('${value.room_key}', '${value.full_name}')">
        <div class="wrap">
          <span class="contact-status ${value.is_logged ? 'online' : null}"></span>
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/User_font_awesome.svg/1200px-User_font_awesome.svg.png" />
          <div class="meta">
            <p class="">${value.full_name} ${value.is_logged ? ' - online' : ' - offline'}</p>
          </div>
        </div>
      </li>
    `);
  });
}

function LOAD_MESSAGES(TARGET_ROOM_KEY, TARGET_NAME){
  $('.content').addClass('blur_div');
  $('#TARGET_USERNAME').text(TARGET_NAME);
  var USER_DATA = JSON.parse(localStorage.getItem('user_data'));
  socket.emit('FETCH_MESSAGES', {"ROOM_KEY": USER_DATA.room_key + TARGET_ROOM_KEY});
}

function SHOW_MESSAGES(MESSAGE){
  $('#chat_message').html('');
  $.each(MESSAGE, function (index, value) {
    $('#chat_message').append(`
      <li class="${value.message_type}" key="${index}">
        <p>${value.message}</p>
      </li>
    `);
  });
  $('.content').removeClass('blur_div');
}