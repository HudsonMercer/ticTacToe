$(document).ready(function(){
    //Global Vars
    var session = {
    userName: 'default',
    gameTurn: '0',
    tttArray: $('content2'),
    lastPlayer: 'O',
    firebaseRef: undefined,
    state: undefined,
    curDate: Date().toString(),
    ID: Math.random().toString(36).substring(7),
    open: function(){
      session.userName = $('#loginNameInput').val() || session.userName;
      session.ID = $('#loginSesIDInput').val() || session.ID;
      session.playerState = 'host';
      session.firebaseRef = firebase.database().ref('/sessions/' + session.ID);
      session.firebaseRef.child('host').set(session.userName);
      session.firebaseRef.child('createdOn').set(session.curDate);
      session.firebaseRef.child('lastPlayer').set(session.lastPlayer);
      $('#sessionID').text('Session ID: ' + session.ID + ' ');
      $('.loginScreen').hide();
    },
    speak: function(){
      return session.userName;
    }
  },
  colorScheme = {
    red: '#AC433B',
    green: '#2D843C',
    blue: '#6C999F'
};

    $('.winPopup').hide();
    $('.sesID').text(session.ID);
    $('#loginSesIDInput').val(session.ID);

    function yell(){
      console.log(Date());
    }

    function joinSession(){
      playerState = 'client';
      var a = 'some stuff';
      // TODO: Add join session logic here
      $('.loginScreen').hide();
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
                    session.firebaseRef.child('winner').set(session.lastPlayer);
                    session.lastPlayer = 'R';
                    }
        }

    $('.content2').click(function(){
        event.stopPropagation();
        var curText = $(this).text();

        if(session.lastPlayer === 'O' && curText === ''){
            session.lastPlayer = 'X';
            session.firebaseRef.child('lastPlayer').set(session.lastPlayer); //Called before we change the turn, represents the current players turn.
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
});
