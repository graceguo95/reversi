/* functions for general use */

/* This function returns the value associated with 'whichParam' on the URL */

function getURLParameters(whichParam)
{
  var pageURL = window.location.search.substring(1);
  var pageURLVariables = pageURL.split('&');
  for(var i = 0; i < pageURLVariables.length; i++) {
    var parameterName = pageURLVariables[i].split('=');
    if(parameterName[0] == whichParam){
      return parameterName[1];
    }
  }
}

var username = getURLParameters('username');
if(typeof username == 'undefined' || !username){
  console.log(username);
  username = 'Anonymous_'+ Math.floor(Math.random() * 1000);
}

var chat_room = getURLParameters('game_id');
if(typeof chat_room == 'undefined' || !chat_room){
  chat_room = 'lobby';
}

/* Connect to the socket server */

var socket = io.connect();

// What to do when server sends me a log message //

socket.on('log',function(array){
  console.log.apply(console,array);
});

// What to do when server responds that someone joined a room //
socket.on('join_room_response',function(payload){
  if(payload.result == 'fail'){
    alert(payload.message);
    return;
  }

  // If we are being notified that we joined the room, then ignore it //

  if(payload.socket_id == socket.id){
    return;
  }


  // If someone joined, then add a new row to the lobby table //
  var dom_elements = $('.socket_'+payload.socket_id);

  // If we don't already have an entry for this person //
  if(dom_elements.length == 0){
    var nodeA = $('<div></div>');
    nodeA.addClass('socket_'+payload.socket_id);

    var nodeB = $('<div></div>');
    nodeB.addClass('socket_'+payload.socket_id);

    var nodeC = $('<div></div>');
    nodeC.addClass('socket_'+payload.socket_id);

    nodeA.addClass('w-100');

    nodeB.addClass('col-6 text-right');
    nodeB.append('<h3>'+payload.username+'</h3>');

    nodeC.addClass('col-6 text-left');
    var buttonC = makeInviteButton(payload.socket_id);
    nodeC.append(buttonC);

    nodeA.hide();
    nodeB.hide();
    nodeC.hide();
    $('#players').append(nodeA,nodeB,nodeC);
    nodeA.slideDown(1000);
    nodeB.slideDown(1000);
    nodeC.slideDown(1000);
  }

  else{
    uninvite(payload.socket_id);
    var buttonC = makeInviteButton(payload.socket_id);
    $('.socket_'+payload.socket_id+'button').replaceWith(buttonC);
    dom_elements.slideDown(1000);
  }


  // Manage message that new player has joined //
  var newHTML = '<p>'+payload.username+' just entered the room</p>';
  var newNode = $(newHTML);
  newNode.hide();
  $('#messages').prepend(newNode);
  newNode.slideDown(1000);
  newNode.delay(15000);
  newNode.fadeOut(1900);
});

function send_message(){
  var payload={};
  payload.room = chat_room;
  payload.username = username;
  payload.message = $('#send_message_holder').val();
  console.log('*** Client Log Message: \'send_message\' payload: '+JSON.stringify(payload));
  socket.emit('send_message',payload);
  $('send_message_holder').val('')
}

socket.on('send_message_response',function(payload){
  if(payload.result == 'fail'){
    alert(payload.message);
    return;
  }
  var newHTML = '<p><b>'+payload.username+':</b> '+payload.message+'</p>';
  var newNode = $(newHTML);
  newNode.hide();
  $('#messages').prepend(newNode);
  newNode.slideDown(1000);
  newNode.delay(15000);
  newNode.fadeOut(1900);
});



// What to do when server responds that someone has left a room //
socket.on('player_disconnected',function(payload){
  if(payload.result == 'fail'){
    alert(payload.message);
    return;
  }

  // If we are being notified that we left the room, then ignore it //

  if(payload.socket_id == socket.id){
    return;
  }

  // If someone left, then animate out their content //
  var dom_elements = $('.socket_'+payload.socket_id);

  // If we don't already have an entry for this person //
  if(dom_elements.length != 0){
    dom_elements.slideUp(1000);
  }

  // Manage message that new player has left //
  var newHTML = '<p>'+payload.username+' has left the room</p>';
  var newNode = $(newHTML);
  newNode.hide();
  $('#messages').prepend(newNode);
  newNode.slideDown(1000);
  newNode.delay(15000);
  newNode.fadeOut(1900);
});

//////////////
// Inviting //
//////////////

function invite(who){
  var payload = {};
  payload.requested_user = who;
  console.log('*** Client Log Message: \'invite\' payload: '+JSON.stringify(payload));
  socket.emit('invite',payload);
}

socket.on('invite_response',function(payload){
  if(payload.result == 'fail'){
    alert(payload.message);
    return;
  }
  var newNode = makeInvitedButton(payload.socket_id);
  $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

socket.on('invited',function(payload){
  if(payload.result == 'fail'){
    alert(payload.message);
    return;
  }
  var newNode = makePlayButton(payload.socket_id);
  $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});


//////////////
// Uninviting //
//////////////

function uninvite(who){
  var payload = {};
  payload.requested_user = who;
  console.log('*** Client Log Message: \'uninvite\' payload: '+JSON.stringify(payload));
  socket.emit('uninvite',payload);
}

socket.on('uninvite_response',function(payload){
  if(payload.result == 'fail'){
    alert(payload.message);
    return;
  }
  var newNode = makeInviteButton(payload.socket_id);
  $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

socket.on('uninvited',function(payload){
  if(payload.result == 'fail'){
    alert(payload.message);
    return;
  }
  var newNode = makeInviteButton(payload.socket_id);
  $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

//////////////
// Play //
//////////////

function game_start(who){
  var payload = {};
  payload.requested_user = who;
  console.log('*** Client Log Message: \'game_start\' payload: '+JSON.stringify(payload));
  socket.emit('game_start',payload);
}

socket.on('game_start_response',function(payload){
  if(payload.result == 'fail'){
    alert(payload.message);
    return;
  }
  var newNode = makeEngagedButton(payload.socket_id);
  $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
  window.location.href = 'game.html?username='+username+'&game_id='+payload.game_id;
});

// Functions //



function makeInviteButton(socket_id){
  var newHTML = '<button type=\'button\' class=\'btn inviteButton\'>Invite</button>';
  var newNode = $(newHTML);
  newNode.click(function(){
    invite(socket_id);
  });
  return(newNode);
}

function makeInvitedButton(socket_id){
  var newHTML = '<button type=\'button\' class=\'btn invitedButton\'>Invited</button>';
  var newNode = $(newHTML);
  newNode.click(function(){
    uninvite(socket_id);
  });
  return(newNode);
}

function makePlayButton(socket_id){
  var newHTML = '<button type=\'button\' class=\'btn playButton\'>Play</button>';
  var newNode = $(newHTML);
  newNode.click(function(){
    game_start(socket_id);
  });
  return(newNode);
}

function makeEngagedButton(){
  var newHTML = '<button type=\'button\' class=\'btn playButton\'>Engaged</button>';
  var newNode = $(newHTML);
  return(newNode);
}

$(function(){
  var payload = {};
  payload.room = chat_room;
  payload.username = username;

  console.log('*** Client Log Message: \'join_room\' payload: '+JSON.stringify(payload));
  socket.emit('join_room',payload);

  $('#quit').append('<a href="lobby.html?username='+username+'"class="btn btn-danger btn-default active" role="button" aria-pressed="true">Quit</a>');

});


var old_board = [
                  ['?','?','?','?','?','?','?','?'],
                  ['?','?','?','?','?','?','?','?'],
                  ['?','?','?','?','?','?','?','?'],
                  ['?','?','?','?','?','?','?','?'],
                  ['?','?','?','?','?','?','?','?'],
                  ['?','?','?','?','?','?','?','?'],
                  ['?','?','?','?','?','?','?','?'],
                  ['?','?','?','?','?','?','?','?']
                ];

var my_color = ' ';
var interval_timer;

socket.on('game_update',function(payload){
  console.log('*** Client Log Message: \'game_update\'\n\tpayload: '+JSON.stringify(payload));
  /* Check for a good board update */
  if(payload.result == 'fail'){
    console.log(payload.message);
    window.location.href = 'lobby.html?username='+username;
    return;
  }

  /* Check for a good board in the payload */
  var board = payload.game.board;
  if(typeof board == 'undefined' || !board){
    console.log('Internal error: received a malformed board update from the server');
    return;
  }

  /* Update my color */
  if(socket.id == payload.game.player_cat.socket){
    my_color = 'cat';
  }
  else if(socket.id == payload.game.player_robot.socket){
    my_color = 'robot';
  }
  else{
    /* Something weird is going on */
    /* Send client back to lobby */
    window.location.href = 'lobby.html?username='+username;
    return;
  }

  var myTurn = ' ';

  if(my_color == 'cat' && payload.game.whose_turn == 'cat'){
    myTurn = 'my';
  }
  else if(my_color == 'robot' && payload.game.whose_turn == 'robot'){
    myTurn = 'my';
  }
  else if(my_color == 'cat' && payload.game.whose_turn == 'robot'){
    myTurn = 'robot\'s';
  }
  else if(my_color == 'robot' && payload.game.whose_turn == 'cat'){
    myTurn = 'cat\'s';
  }
  else{
    console.log('Turn naming error');
  }


  $('#my_color').html('<h3 id="my_color">I am '+my_color+'</h3>');
  $('#my_color').append('<h4>'+myTurn+' turn [<span id="elapsed"></span>]</h4>');

  clearInterval(interval_timer);
  interval_timer = setInterval(function(last_time){
    return function(){
            // Do work of updating UI //
            var d = new Date();
            var elapsedmilli = d.getTime() - last_time;
            var minutes = Math.floor(elapsedmilli / (60*1000));
            var seconds = Math.floor((elapsedmilli % (60*1000))/1000);
            if(seconds < 10){
              $('#elapsed').html(minutes+':0'+seconds);
            }
            else{
              $('#elapsed').html(minutes+':'+seconds);
            }
    }}(payload.game.last_move_time)
    ,1000);

  /* Animate changes to the board */

  var pinksum = 0;
  var purplesum = 0;

  var row,column;
  for(row = 0; row < 8; row++){
    for(column = 0; column < 8; column++){
      if(board[row][column] == 'r'){
        purplesum++;
      }
      if(board[row][column] == 'c'){
        pinksum++;
      }
      /* if a board space has changed */
      if(old_board[row][column] != board[row][column]){
        if(old_board[row][column] == '?' && board[row][column] == ' '){
          $('#'+row+'_'+column).html('<img src="assets/images/empty.gif" alt="empty square" style="z-index:-1;position:relative;"/>');
          console.log('This is an empty square');
        }
        else if(old_board[row][column] == '?' && board[row][column] == 'c'){
          $('#'+row+'_'+column).html('<img src="assets/images/Cat.svg" class="fade-in" style="width:64px;height:64px;background-color:#FAFAFA;" alt="pink square"/>');
        }
        else if(old_board[row][column] == '?' && board[row][column] == 'r'){
          $('#'+row+'_'+column).html('<img src="assets/images/Robot.svg" class="fade-in" style="width:64px;height:64px;background-color:#FAFAFA;" alt="purple square"/>');
        }
        else if(old_board[row][column] == ' ' && board[row][column] == 'c'){
          $('#'+row+'_'+column).html('<img src="assets/images/Cat.svg" class="fade-in" style="width:64px;height:64px;background-color:#FAFAFA;" alt="pink square"/>');
        }
        else if(old_board[row][column] == ' ' && board[row][column] == 'r'){
          $('#'+row+'_'+column).html('<img src="assets/images/Robot.svg" class="fade-in" style="width:64px;height:64px;background-color:#FAFAFA;" alt="purple square"/>');
        }
        else if(old_board[row][column] == 'c' && board[row][column] == ' '){
          $('#'+row+'_'+column).html('<img src="assets/images/empty.gif" class="flip-out-hor-top" alt="empty square" style="z-index:-1;position:relative;"/>');
        }
        else if(old_board[row][column] == 'r' && board[row][column] == ' '){
          $('#'+row+'_'+column).html('<img src="assets/images/empty.gif" alt="empty square style="z-index:-1;position:relative;"/>');
        }
        else if(old_board[row][column] == 'c' && board[row][column] == 'r'){
          $('#'+row+'_'+column).html('<img src="assets/images/Robot.svg" class="flip-horizontal-bottom" style="width:64px;height:64px;background-color:#FAFAFA;" alt="purple square"/>');
        }
        else if(old_board[row][column] == 'r' && board[row][column] == 'c'){
          $('#'+row+'_'+column).html('<img src="assets/images/Cat.svg" class="flip-horizontal-bottom" style="width:64px;height:64px;background-color:#FAFAFA;" alt="pink square"/>');
        }
        else{
          $('#'+row+'_'+column).html('<img src="assets/images/error.gif" alt="error"/>');
        }
      }
      /* Set up interactivity */
      $('#'+row+'_'+column).off('click');
      $('#'+row+'_'+column).removeClass('hovered_over');

      if(payload.game.whose_turn === my_color){
        if(payload.game.legal_moves[row][column] === my_color.substr(0,1)){
          $('#'+row+'_'+column).addClass('hovered_over');
          $('#'+row+'_'+column).click(function(r,c){
                return function(){
                  var payload = {};
                  payload.row = r;
                  payload.column = c;
                  payload.color = my_color;
                  console.log('*** Client Log Message: \'play token\' payload: '+JSON.stringify(payload));
                  socket.emit('play_token',payload);
                };
          }(row,column));
        }
      }
    }
  }
  $('#purplesum').html(purplesum);
  $('#pinksum').html(pinksum);

  old_board = board;

});

socket.on('play_token_response',function(payload){
  console.log('*** Client Log Message: \'play_token_response\'\n\tpayload: '+JSON.stringify(payload));
  /* Check for a good play_token_response */
   if(payload.result == 'fail'){
     console.log(payload.message);
     alert(payload.message);
     return;
  }
});

socket.on('game_over',function(payload){
  console.log('*** Client Log Message: \'game_over\'\n\tpayload: '+JSON.stringify(payload));
  /* Check for a good play_token_response */
   if(payload.result == 'fail'){
     console.log(payload.message);
     return;
  }
  /* Jump to a new page */

  $('#game_over').html('<h1>Game Over</h1><h3>'+payload.who_won+' won!</h3>');
  $('#game_over').append('<a href="lobby.html?username='+username+'"class="btn btn-success btn-lg active" role="button" aria-pressed="true">Return to lobby</a>');
});
