// $(document).ready(function(){
    //"Global" Vars
    var session = {
    userName: 'default',
    tttArray: $('content2'),
    lastPlayer: 'O',
    playerState: undefined,
    firebaseRef: undefined,
    curDate: Date().toString(),
    ID: Math.random().toString(36).substring(7),
    open: function(){
      session.userName = $('#loginNameInput').val() || session.userName;
      session.ID = $('#loginSesIDInput').val() || session.ID;
      session.playerState = 'host';
      session.firebaseRef = firebase.database().ref('/sessions/' + session.ID);
      session.firebaseRef.child('hostName').set(session.userName);
      session.firebaseRef.child('createdOn').set(session.curDate);
      session.firebaseRef.child('lastPlayer').set(session.lastPlayer);
      session.firebaseRef.child('clientName').set('No Player');
      session.firebaseRef.child('tttArray').set('EEEEEEEEE');
      $('#sessionIDContainer').html('Session ID: <span id="sessionID">' + session.ID + '</span>');
      $('.loginScreen').hide();
      $('.hostName').text(session.userName);
      $('.clientName').text('No Player');
      session.startPlayerList();
      session.startBoardWatcher();
    },
    startPlayerList: function(){
      session.firebaseRef.child('hostName').once('value', function(hostName){
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
    },
    startBoardWatcher: function(){
      session.firebaseRef.child('tttArray').on('value', session.boardPull);
    },
    join: function(){
      session.firebaseRef = firebase.database().ref('/sessions/' + session.ID);

      if(session.firebaseRef.once('value', function(exists){
          if(exists.val() !== null){
            console.log(exists.val());
            alert('no game!');
            return true;
          } else {
            console.log(exists.val());
            return false;
          }
        })){
          //session.firebaseRef.child('clientName').set(session.userName);
          //session.startPlayerList();
        } else {
          alert('Session does not exist.');
        }
      //TODO: join a game in progress
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
    $('#loginSesIDInput').val(session.ID);

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
                    $('.winPopup').show();
                    $('.winPopup').html('<br/><br/><br/>' + session.lastPlayer + ' Wins!<br/>Click to reset');

                    scorePath.once('value', function(snapshot){
                      scorePath.set(snapshot.val() + 1);
                    });
                    session.firebaseRef.child('lastWinner').set(session.lastPlayer);
                    session.lastPlayer = 'R';
                    }
        }

    $('.content2').click(function(){
        event.stopPropagation();
        var curText = $(this).text();

        if(session.lastPlayer === 'O' && curText === ''){
            session.lastPlayer = 'X';
            session.firebaseRef.child('lastPlayer').set(session.lastPlayer);
            $(this).text(session.lastPlayer);
            $('#playerTurn').text('Player Turn: O');
            testWin();
        } else if(session.lastPlayer === 'X' && curText === ''){
            session.lastPlayer = 'O';
            session.firebaseRef.child('lastPlayer').set(session.lastPlayer);
            $(this).text(session.lastPlayer);
            $('#playerTurn').text('Player Turn: X');
            testWin();
        }

        var arrayTie = $('.content2').text();
        if(session.tttArray.length === arrayTie.length) {
            $('.winPopup').show();
            $('.winPopup').html('<br/><br/><br/>Tie! <br/>Click to reset!');
        }

        session.boardPush();
    });

    $('.winPopup').click(function(){
        event.stopPropagation();
        $(this).hide();
        $('.content2').css('background-color', colorScheme.red);
        session.lastPlayer = 'O';
        $('.content2').text('');
        $('#playerTurn').text('Player Turn: X');
    });

    $('.loginBtn').on('click', session.open);
    $('.joinBtn').on('click', session.join);

    $('#sessionID').click();
// });
