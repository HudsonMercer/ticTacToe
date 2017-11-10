//V2.2 RC Internet Multiplayer, Firebase integration, Jquery DOM manipulation

// $(document).ready(function(){
    //"Global" Vars
var
  fbconfig = {
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

firebase.initializeApp(fbconfig);
session.lobby.firebaseRef = firebase.database().ref('/lobby/');
session.lobby.gamesRef = firebase.database().ref('/sessions/');
session.lobby.listWatch();
session.lobby.chat.watch();
session.lobby.chat.userWatch();
$('.winPopup').hide();
$('.hostMenu').hide();
$('.sesID').text(session.ID + ' ');

function closeWinBanner(overrideHost){
  if (session.host === true || overrideHost === true){
      event.stopPropagation();
      $('.winPopup').hide();
      $('.winPopupShadow').hide();
      $('.content2').css('background-color', colorScheme.red);
      session.lastPlayer = 'O';
      session.firebaseRef.child('tttArray').set('EEEEEEEEE');
      session.firebaseRef.child('lastPlayer').set('O');
      session.firebaseRef.child('closeWinBanner').set('1');
    }
  }

function testWin(){
    checkScenario(0, 1, 2);//row 1
    checkScenario(3, 4, 5);//row 2
    checkScenario(6, 7, 8);//row 3
    checkScenario(0, 4, 8);//diagonal left right
    checkScenario(2, 4, 6);//diagonal right left
    checkScenario(0, 3, 6);//column 1
    checkScenario(1, 4, 7);//column 2
    checkScenario(2, 5, 8);//column 3
}

function checkScenario(a, b, c){
  var scorePath = session.firebaseRef.child(session.lastPlayer + 'score'),
  scorePathTie = session.firebaseRef.child('Tscore');
  session.tttArray = $('.content2');

        if (session.tttArray[a].textContent === session.tttArray[b].textContent &&
            session.tttArray[a].textContent === session.tttArray[c].textContent &&
            session.tttArray[a].textContent != ''){
                session.tttArray[a].style.backgroundColor = colorScheme.green;
                session.tttArray[b].style.backgroundColor = colorScheme.green;
                session.tttArray[c].style.backgroundColor = colorScheme.green;
                session.firebaseRef.child('lastPlayer').once('value').then(function(winner){
                  $('.winPopup').show();
                  $('.winPopupShadow').show();

                  if (session.host === true){
                    $('.winPopup').html('<br/><br/><br/>' + winner.val() + ' Wins!<br/>Click to reset');
                    scorePath.once('value', function(snap){
                      scorePath.set(snap.val() + 1);
                    });
                  } else {
                    $('.winPopup').html('<br/><br/><br/>' + winner.val() + ' Wins!<br/>Wait for ' + $('.hostName').text() + ' to reset');

                    session.firebaseRef.child('closeWinBanner').on('value', function(snap){
                      if (snap.val() === '1'){
                        closeWinBanner(true);
                        session.firebaseRef.child('closeWinBanner').off('value');
                        session.firebaseRef.child('closeWinBanner').set('0');
                      }
                    });
                  }
                  return null;
                });
              } else if ($('.content2').text().length === 9) {
                  $('.winPopup').show();
                  $('.winPopupShadow').show();
                  if (session.host === true){
                    $('.winPopup').html('<br/><br/><br/>' + 'Tie!' + '<br/>Click to reset');
                    session.lastPlayer = 'T';
                    session.firebaseRef.child('lastWinner').set(session.lastPlayer);
                    scorePathTie.once('value', function(snap){
                      scorePathTie.set(snap.val() + 1);
                    });
                  } else {
                    $('.winPopup').html('<br/><br/><br/>' + 'Tie!' + '<br/>Wait for ' + $('.hostName').text() + ' to reset');
                    session.lastPlayer = 'T';
                    session.firebaseRef.child('closeWinBanner').on('value', function(snap){
                      if (snap.val() === '1'){
                        closeWinBanner(true);
                        session.firebaseRef.child('closeWinBanner').off('value');
                        session.firebaseRef.child('closeWinBanner').set('0');
                      }
                    });
                    }
    }
  }

function makePlay(){
    event.stopPropagation();
    var targetElement = this;

    session.firebaseRef.child('lastPlayer').once('value').then(function(snap){
      if($(targetElement).text() === '' && snap.val() !== session.playerState && session.playerState !== 'observer'){
        $(targetElement).text(session.playerState);
        session.firebaseRef.child('lastPlayer').set(session.playerState);
        session.boardPush();
      }
    });
  }

function resizeImg(file, max_width, max_height, compression_ratio, imageEncoding, callback){
  function dataURItoBlob(dataURI) {
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  var byteString = atob(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);

  // create a view into the buffer
  var ia = new Uint8Array(ab);

  // set the bytes of the buffer to the correct values
  for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }

  // write the ArrayBuffer to a blob, and you're done
  var blob = new Blob([ab], {type: mimeString});
  return blob;

}

  var fileLoader = new FileReader(),
  canvas = document.createElement('canvas'),
  context = null,
  imageObj = new Image(),
  blob = null;

  //create a hidden canvas object we can use to create the new resized image data
  canvas.id     = "hiddenCanvas";
  canvas.width  = max_width;
  canvas.height = max_height;
  canvas.style.visibility   = "hidden";
  document.body.appendChild(canvas);

  //get the context to use
  context = canvas.getContext('2d');

  // check for an image then
  //trigger the file loader to get the data from the image
  if (file.type.match('image.*')) {
      fileLoader.readAsDataURL(file);
  } else {
      alert('File is not an image');
  }

  // setup the file loader onload function
  // once the file loader has the data it passes it to the
  // image object which, once the image has loaded,
  // triggers the images onload function
  fileLoader.onload = function() {
      var data = this.result;
      imageObj.src = data;
  };

  fileLoader.onabort = function() {
      alert("The upload was aborted.");
  };

  fileLoader.onerror = function() {
      alert("An error occured while reading the file.");
  };


  // set up the images onload function which clears the hidden canvas context,
  // draws the new image then gets the blob data from it
  imageObj.onload = function() {

      // Check for empty images
      if(this.width == 0 || this.height == 0){
          alert('Image is empty');
      } else {

          context.clearRect(0,0,max_width,max_height);
          context.drawImage(imageObj, 0, 0, this.width, this.height, 0, 0, max_width, max_height);


          //dataURItoBlob function available here:
          // http://stackoverflow.com/questions/12168909/blob-from-dataurl
          // add ')' at the end of this function SO dont allow to update it without a 6 character edit
          blob = dataURItoBlob(canvas.toDataURL(imageEncoding));

          //pass this blob to your upload function
          if(callback){
            callback(URL.createObjectURL(blob));
          }
          return URL.createObjectURL(blob);
      }
  };

  imageObj.onabort = function() {
      alert("Image load was aborted.");
  };

  imageObj.onerror = function() {
      alert("An error occured while loading image.");
  };

}

$('.content2').click(makePlay);
$('.winPopup').click(closeWinBanner);
$('.lobbyAvatar').click(function(){
  $('.lobbySettingsContainer').toggle();
});
$('.launchBtn').on('click', session.open);
$('.lobbySettingsHeader').on('mousedown', function(e){
  var target = $('.lobbySettingsContainer'),
      offset = {top: e.pageY - target.offset().top, left: e.pageX - target.offset().left};

  $(document).on('mousemove', function(ev){
    var newOffset = {top: ev.pageY - offset.top, left: ev.pageX - offset.left};
    target.offset(newOffset);
  });

  $(document).on('mouseup', function(){
    var i = {top: target.offset().top, left: target.offset().left};
   $(document).off('mousemove');
   $(document).off('mouseup');
   if(target.offset().top <= 0){
     i.top = 0;
     target.offset(i);
   }
   if(target.offset().left <= 0){
     i.left = 0;
     target.offset(i);
   }
   if(target.offset().top >= window.innerHeight - $('.lobbySettingsHeader').height()){
   i.top = window.innerHeight - $('.lobbySettingsHeader').height();
   target.offset(i);
   }
   if(target.offset().left >= window.innerWidth - $('.lobbySettingsHeader').width() * .2){
   i.left = window.innerWidth - $('.lobbySettingsHeader').width() * .2;
   target.offset(i);
   }
  });
});
$(window).on('unload', session.leave);
$('.lobbyHeaderSettings').on('click', function(){
  $('.lobbySettingsContainer').toggle();
});
$('.lobbyChatInputSubmit').click(function(){
  session.lobby.chat.submit($('#lobbyChatInputFieldID').val());
});
$('#lobbyChatInputFieldID').keyup(function(e){
  if(e.keyCode === 13){
    $('.lobbyChatInputSubmit').trigger('click');
  }
});
$('.lobbySettingsName').click(function(){
  //Abandon all hope ye who code here
  event.stopPropagation();
  var nameInUse = false,
  parent = $('#lobbySettingsName').replaceWith('<input style="position: relative;top: 4vh;" id="lobbySettingsNameFieldID" type="text" name="lobbySettingsNameField" value="'+session.userName+'" placeholder="Type a new name here!"></input>'),
  child = $('#lobbySettingsNameFieldID').keyup(function(e){
    event.stopPropagation();
    if(e.keyCode === 13){
      session.lobby.firebaseRef.child('chat').child('users').once('value', function(snap){
        snap.forEach(function(snapChild){
          if(snapChild.val() === session.userName){
            $('.lobbySettingsContainer').hide();
            session.lobby.firebaseRef.child('chat').child('users').child(session.userName).set(null);
          } else if (child.val() === snapChild.val()){
            //alert('Name already in use!');
            nameInUse = true;
          }
        });
        console.log(nameInUse);
        if(nameInUse === false){
          session.userName = child.val().replace(/[^a-z ]/ig, '');
          session.lobby.firebaseRef.child('chat').child('users').child(session.userName).set(session.userName);
          $('#lobbySettingsNameFieldID').replaceWith('<div id="lobbySettingsName">Current Name: ' + session.userName + '</br><span class="lobbySettingsNameSubtext">(click to edit)</span></div>');
          $('#lobbyHeaderNameID').text('Hello, ' + session.userName + '!');
        }
      });
    }
  });
});
$('.lobbyChatHost').click(function(){
  if(session.userName === 'default'){
    alert('You must have a name to host a game!');
    return false;
  }
    $('.hostMenu').toggle();
  });
$('.lscst').click(function(){
  $(this).css('background-color', $(this).attr('id'));
});
$('.lobbyAvatarImg').on('click', function(){
  $('.fileinputButton').click();
});
$('.fileinputButton').on('change', function(e){
  var targetFile = URL.createObjectURL(e.target.files[0]),
      a = resizeImg(e.target.files[0], 256, 256, 1, "image/png", function(e){
        $('.lobbyAvatarImg').attr('src', e);
        $('.lobbySettingsAvatarLImg').attr('src', e);
        $('.lobbySettingsAvatarMImg').attr('src', e);
        $('.lobbySettingsAvatarSImg').attr('src', e);
        //IT WORKS DONT TOUCH IT.
      });
      //a is the blob URI that leads to the image, upload at your own peril.
});
// });
