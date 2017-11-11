export default var fbconfig = {
    apiKey: "AIzaSyCWcbz2SwfHQDkVq9qu0_UmJT9giOVNVrM",
    authDomain: "tictactoe-b8474.firebaseapp.com",
    databaseURL: "https://tictactoe-b8474.firebaseio.com",
    projectId: "tictactoe-b8474",
    storageBucket: "tictactoe-b8474.appspot.com",
    messagingSenderId: "1097292712686"
  },
  session = {
    lobby: {
      listWatch: function(){
        var divChild = undefined;
        //add to lobby list
        session.lobby.gamesRef.on('child_added', function(snap){
          divChild = $(`<div class="lobbyGameListItem"><div class="lobbyGameListIcon ${snap.key}"></div><span class="lobbyGameListText ${snap.key}">${snap.child('gameName/').val()}: ${snap.child('hostName/').val()}</span></div>`);
          $('.lobbyGameList').append(divChild);
          $('.lobbyGameListItem').on('click', session.join);
          divChild.addClass(snap.key);
        });

        //remove from lobby list
        session.lobby.gamesRef.on('child_removed', function(snap){
          $('.' + snap.key).remove();
        });

        //change color depending on what the game state is
        session.lobby.gamesRef.on('child_changed', function(snap){

          var jqueryTar = $(`.lobbyGameListItem.${snap.key}`);

          jqueryTar.html(`<div class="lobbyGameListIcon ${snap.key}"></div><span class="lobbyGameListText ${snap.key}">${snap.child('gameName/').val()}: ${snap.child('hostName/').val()}</span>`);

          switch(snap.child('gameState/').val()){
            case 'unhosted':
              jqueryTar.children(`.lobbyGameListIcon.${snap.key}`).css('background-color', colorScheme.yell);
              break;
            case 'hosted':
              jqueryTar.children(`.lobbyGameListIcon.${snap.key}`).css('background-color', colorScheme.grn);
              break;
            case 'empty':
              jqueryTar.children(`.lobbyGameListIcon.${snap.key}`).css('background-color', colorScheme.grn);
              break;
            case 'full':
              jqueryTar.children(`.lobbyGameListIcon.${snap.key}`).css('background-color', colorScheme.red);
              break;
            default:
            break;
          }


        });
      },
      chat: {
        area: $('.lobbyChatArea'),
        userListArea: $('.lobbyChatUserList'),
        start: function(){
          var areaShort = session.lobby.chat.area;
          session.lobby.firebaseRef.child('chat').child('items').once('value').then(function(snap){
            snap.forEach(function(chatItem){
              areaShort.append('<div class="lobbyChatItem">' + chatItem.val() + '</div>');
              areaShort.scrollTop(areaShort[0].scrollHeight); //scroll to the bottom of chat.
            })
          });
        },
        watch: function(){
          var areaShort = session.lobby.chat.area;
          session.lobby.firebaseRef.child('chat').child('items').orderByChild('date').on('child_added', function(snap){
            areaShort.append('<div class="lobbyChatItem">'+ snap.val().message +'</div>');
            areaShort.scrollTop(areaShort[0].scrollHeight); //scroll to the bottom of chat.
          });
        },
        submit: function(message){
          var areaShort = session.lobby.chat.area,
              localKey = Math.random().toString(36).substring(7);
          session.lobby.firebaseRef.child('chat').child('items').child(localKey).child('message').set(session.userName +': '+ message);
          session.lobby.firebaseRef.child('chat').child('items').child(localKey).child('date').set(Date.now());
          $('#lobbyChatInputFieldID').val('');
        },
        userWatch: function() {
          session.lobby.firebaseRef.child('chat').child('users').on('child_added', function(snap){
            var chatItemDiv = $('<div class="lobbyChatUserItem">'+snap.val()+'</div>'),
             child = chatItemDiv.appendTo(session.lobby.chat.userListArea);
            if(child.text() === session.userName){
              child.css('background-color', colorScheme.grn);
            }
          });
          session.lobby.firebaseRef.child('chat').child('users').on('child_removed', function(snap){
            $('.lobbyChatUserItem:contains('+snap.val()+')').remove();
          });
        }
      }
    },
    userName: 'default',
    tttArray: $('content2'),
    host: undefined,
    lastPlayer: 'O',
    playerState: undefined,
    firebaseRef: undefined,
    gameName: 'Unset',
    curDate: Date().toString(),
    ID: Math.random().toString(36).substring(7),
    forceExit: function(reason, resetID){
      $('.winPopup').show();
      $('.winPopupShadow').show();
      var bannerText = $('.winPopup').text(reason + ' Exiting in 3 seconds...');
      setTimeout(function(){bannerText.text(reason + ' Exiting in 2 seconds...')}, 1000);
      setTimeout(function(){bannerText.text(reason + ' Exiting in 1 second....')}, 2000);
      setTimeout(function(){
        $('.lobbyContainer').toggle();
        $('.winPopup').toggle();
        $('.winPopupShadow').toggle();
        session.stopListening();
        if(resetID){session.ID = Math.random().toString(36).substring(7)}
        session.lastPlayer = 'O';
      }, 3000);

    },
    open: function(){
      $('.hostMenu').toggle();
      $('.lobbyContainer').toggle();
      session.host = true;
      session.gameName = $('#gameNameInputID').val();
      session.ID = $('#loginSesIDInput').val() || session.ID;
      session.playerState = 'host';
      session.firebaseRef = firebase.database().ref('/sessions/' + session.ID);
      session.firebaseRef.child('gameState').once('value').then(function(snap){
        if(snap.val() === null || snap.val() === 'unhosted'){
          session.firebaseRef.child('hostName').set(session.userName);
          session.firebaseRef.child('gameName').set(session.gameName);
          session.firebaseRef.child('createdOn').set(session.curDate);
          session.firebaseRef.child('lastPlayer').set(session.lastPlayer);
          session.firebaseRef.child('clientName').set('No Player');
          session.firebaseRef.child('tttArray').set('EEEEEEEEE');
          session.firebaseRef.child('ready').set('true');
          session.firebaseRef.child('gameState').set('hosted');
          session.firebaseRef.child('closeWinBanner').set('0');
          $('#sessionIDContainer').html('Session ID: <span id="sessionID">' + session.ID + ' </span>');
          $('.hostMenu').hide();
          $('.hostName').text(session.userName);
          $('.clientName').text('No Player');
          session.startPlayerList();
          session.startBoardWatcher();
          session.playerState = 'X';
        } else {
          alert('Game is already owned by another player!')
        }
      });
    },
    join: function(){
      event.stopPropagation();
      if(session.userName === 'default'){
        alert('You must have a name to join a game!');
        return false;
      }
      console.log('clicked!');
      $('.lobbyContainer').toggle();
      session.host = false;
      session.ID = $(this).attr('class').replace('lobbyGameListItem ','');
      session.firebaseRef = firebase.database().ref('/sessions/' + session.ID);
      session.firebaseRef.once('value').then(function(snap){
        if(snap.val() !== null && snap.val().gameState === 'hosted'){
          session.boardPull();
          session.startPlayerList();
          session.startBoardWatcher();
          session.firebaseRef.child('gameState').set('full');
          session.firebaseRef.child('clientName').set(session.userName);
          $('#sessionIDContainer').html('Session ID: <span id="sessionID">' + session.ID + '</span>');
          // $('.hostMenu').hide();
          session.playerState = 'O';
        } else if(snap.val() !== null && snap.val().gameState === 'full'){
          session.boardPull();
          session.startPlayerList();
          session.startBoardWatcher();
          session.playerState = 'observer';
          session.firebaseRef.child('observers').child(session.userName).set(session.userName);
          $('.hostMenu').hide();
        } else if(snap.val() !== null && snap.val().gameState === 'unhosted'){
          if (confirm('Game unhosted! Would you like to host it?')){
            session.open();
          }
        } else if(snap.val() === null){
          if (confirm('Cannot find game! Host new game?')){
            session.open();
          }
        } else if(snap.val() !== null && snap.val().gameState === null){
          alert('Something happened and the game wasn\'t initialized properly, try hosting a new game.');
        }
      });
    },
    leave: function(){
      session.lobby.firebaseRef.child('chat').child('users').child(session.userName).set(null);
      session.firebaseRef.child('gameState').once('value').then(function(snap){
        if(session.playerState === 'X'){
          session.firebaseRef.child('gameState').set('unhosted');
          session.firebaseRef.child('host').set('No Host');
          session.firebaseRef.set(null);
        } else if(session.playerState === 'O' && snap.val() !== null && snap.val() !== 'unhosted') {
            session.firebaseRef.child('gameState').set('hosted');
            session.firebaseRef.child('client').set('No Player');
        } else if(session.userName !== 'default' && snap.val() !== null) {
            session.firebaseRef.child('observers').child(session.userName).remove();
        }
      });
    },
    stopListening: function(){
      session.firebaseRef.child('hostName').off();
      session.firebaseRef.child('clientName').off();
      session.firebaseRef.child('observers').off();
      session.firebaseRef.child('lastPlayer').off();
      session.firebaseRef.child('tttArray').off();
    },
    startPlayerList: function(){
      session.firebaseRef.child('hostName').on('value', function(hostName){
        $('.hostName').text(hostName.val());
      });

      session.firebaseRef.child('clientName').on('value', function(clientName){
        $('.clientName').text(clientName.val());
        var text = $('.clientName').text();
        console.log(text);
        if(text === ''){
          session.forceExit("The host left the game!", true);
        }
      });

      session.firebaseRef.child('observers').on('value', function(observerList){
        $('#observerNames').html('');
        observerList.forEach(function(observerName){
          $('#observerNames').append( '<span class="observerName">' + observerName.val() + '</span><br/>');
        })
      });

      session.firebaseRef.child('lastPlayer').on('value', function(snap){
        $('#playerTurn').text('Player Turn: ' + (snap.val() === 'X' ? 'O' : 'X'));
        session.lastPlayer = snap.val();
      });
    },
    startBoardWatcher: function(){
      session.firebaseRef.child('tttArray').on('value', session.boardPull);
    },
    boardPull: function(){
      var i = 0,
      remoteArray = '';
      session.firebaseRef.child('tttArray').once('value').then(function(snap){
        remoteArray = snap.val();
        for(i = 0; i < session.tttArray.length; i ++){
          if(remoteArray[i] === 'E'){
              session.tttArray[i].textContent = '';
          } else {
              session.tttArray[i].textContent = remoteArray[i];
          }
        }
        testWin();
      });
    },
    boardPush: function(){
        var internalArray = '',
        i = 0;

        for(i=0; i < session.tttArray.length; i++){
          if(session.tttArray[i].textContent !== ''){
              internalArray += session.tttArray[i].textContent;
            } else {
              internalArray += 'E';
            }
          }

        console.log('pushing: ' + internalArray);
        session.firebaseRef.child('tttArray').set(internalArray);
      }
    },
  sessionDefault = session,
  colorScheme = {
    red: '#CB3024',	// Main Primary color */
    redLightest: '#FF877D',
    redLight: '#E0564C',
    redDark: '#A41B11',
    redDarkest: '#7C0900',

    blue: '#1B6480',	// Main Secondary color (1) */
    blueLightest: '#538DA3',
    blueLight: '#33748D',
    blueDark: '#0E4E67',
    blueDarkest: '#03394E',

    yell: '#CB7B24',	// Main Secondary color (2) */
    yellLightest: '#FFC17D',
    yellLight: '#E0994C',
    yellDark: '#A45D11',
    yellDarkest: '#7C4000',

    grn: '#1C9C32',	// Main Complement color */
    grnLightest: '#61C572',
    grnLight: '#3AAB4E',
    grnDark: '#0D7D20',
    grnDarkest: '#005F10'
  },
  settingsInt = null;
