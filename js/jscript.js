// $(document).ready(function(){
    //"Global" Vars
    var session = {
    userName: 'default',
    tttArray: $('content2'),
    host: undefined,
    lastPlayer: 'O',
    playerState: undefined,
    firebaseRef: undefined,
    curDate: Date().toString(),
    ID: Math.random().toString(36).substring(7),
    open: function(){
      session.host = true;
      session.userName = $('#loginNameInput').val() || session.userName;
      session.ID = $('#loginSesIDInput').val() || session.ID;
      session.playerState = 'host';
      session.firebaseRef = firebase.database().ref('/sessions/' + session.ID);
      session.firebaseRef.child('hostName').set(session.userName);
      session.firebaseRef.child('createdOn').set(session.curDate);
      session.firebaseRef.child('lastPlayer').set(session.lastPlayer);
      session.firebaseRef.child('clientName').set('No Player');
      session.firebaseRef.child('tttArray').set('EEEEEEEEE');
      session.firebaseRef.child('ready').set('true');
      session.firebaseRef.child('gameState').set('hosted');
      session.firebaseRef.child('closeWinBanner').set('0');
      $('#sessionIDContainer').html('Session ID: <span id="sessionID">' + session.ID + '</span>');
      $('.loginScreen').hide();
      $('.hostName').text(session.userName);
      $('.clientName').text('No Player');
      session.startPlayerList();
      session.startBoardWatcher();
      session.playerState = 'X';
    },
    startPlayerList: function(){
      session.firebaseRef.child('hostName').on('value', function(hostName){
        $('.hostName').text(hostName.val());
      });

      session.firebaseRef.child('clientName').on('value', function(clientName){
        $('.clientName').text(clientName.val());
      });

      session.firebaseRef.child('observers').on('value', function(observerList){
        $('#observerNames').html('');
        observerList.forEach(function(observerName){
          $('#observerNames').append( '<span class="observerName">' + observerName.val() + '</span><br/>' );
        })
      });

      session.firebaseRef.child('lastPlayer').on('value', function(snap){
        $('#playerTurn').text('Player Turn: ' + (snap.val() === 'X' ? 'O' : 'X'));
      });
    },
    startBoardWatcher: function(){
      session.firebaseRef.child('tttArray').on('value', session.boardPull);
    },
    join: function(){
      session.host = false;
      session.userName = $('#loginNameInput').val() || session.userName;
      session.ID = $('#loginSesIDInput').val() || session.ID;
      session.firebaseRef = firebase.database().ref('/sessions/' + session.ID);
      session.firebaseRef.once('value').then(function(snap){
        if(snap.val() !== null && snap.val().gameState === 'hosted'){
          session.startPlayerList();
          session.startBoardWatcher();
          session.firebaseRef.child('gameState').set('full');
          session.firebaseRef.child('clientName').set(session.userName);
          $('#sessionIDContainer').html('Session ID: <span id="sessionID">' + session.ID + '</span>');
          $('.loginScreen').hide();
          session.playerState = 'O';
        } else if(snap.val() !== null && snap.val().gameState === 'full'){
          session.startPlayerList();
          session.startBoardWatcher();
          session.playerState = 'observer';
          $('.loginScreen').hide();
        } else if(snap.val() !== null && snap.val().gameState === 'unhosted'){
          // Game is unhosted, ask if they would like to host.
        } else if(snap.val() === null){
          alert('Cannot find game!');
        } else if(snap.val() !== null && snap.val().gameState === null){
          alert('Something happened and the game wasn\'t initialized properly, try hosting a new game.');
        }
      });
    },
    boardPull: function(){
      var i = 0,
      remoteArray = '';

      session.firebaseRef.child('tttArray').once('value').then(function(snap){
        // console.log('Pulled: ' + snap.val());
        remoteArray = snap.val();
        // console.log(remoteArray);
        for(i = 0; i < session.tttArray.length; i ++){
          if(remoteArray[i] === 'E'){
              $(session.tttArray[i]).text('');
          } else {
              $(session.tttArray[i]).text(remoteArray[i]);
          }
        }
        testWin();
        // console.log('Wubba lubba dub dub!');
      });
    },
    boardPush: function(){
      var internalArray = '',
      i = 0;

      for(i=0; i < session.tttArray.length; i++){
        if($(session.tttArray[i]).text() !== ''){
            internalArray += $(session.tttArray[i]).text();
          } else {
            internalArray += 'E';
          }
        }

      console.log('pushing: ' + internalArray);
      session.firebaseRef.child('tttArray').set(internalArray);
    }
  },
  colorScheme = {
    red: '#AC433B',
    green: '#2D843C',
    blue: '#6C999F'
};

    $('.winPopup').hide();

    function closeWinBanner(overrideHost){
      if (session.host === true || overrideHost === true){
          event.stopPropagation();
          $('.winPopup').hide();
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
      var scorePath = session.firebaseRef.child(session.lastPlayer + 'score');
      session.tttArray = $('.content2');

            if ($(session.tttArray[a]).text() === $(session.tttArray[b]).text() &&
                $(session.tttArray[a]).text() === $(session.tttArray[c]).text() &&
                $(session.tttArray[a]).text() != ''){
                    $(session.tttArray[a]).css('background-color', colorScheme.green);
                    $(session.tttArray[b]).css('background-color', colorScheme.green);
                    $(session.tttArray[c]).css('background-color', colorScheme.green);
                    session.firebaseRef.child('lastPlayer').once('value').then(function(winner){
                      $('.winPopup').show();

                      if (session.host === true){
                        $('.winPopup').html('<br/><br/><br/>' + winner.val() + ' Wins!<br/>Click to reset');
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

                      scorePath.once('value', function(snap){
                        scorePath.set(snap.val() + 1);
                      });
                      return null;
                    });
                    session.firebaseRef.child('lastWinner').set(session.lastPlayer);
                    session.lastPlayer = 'E';

                  } else if($('.content2').text().length === 9) {
                      $('.winPopup').show();
                      $('.winPopup').html('<br/><br/><br/>' + 'Tie!' + '<br/>Click to reset');
                      session.lastPlayer = 'T';
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
      // TODO: add handler for tie scenarios.
    }

    $('.content2').click(false, makePlay);

    $('.winPopup').click(closeWinBanner);

    $('.loginBtn').on('click', session.open);
    $('.joinBtn').on('click', session.join);

// });
