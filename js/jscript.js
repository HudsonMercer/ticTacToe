$(document).ready(function(){
    //Global Vars
    var userName = 'default',
      gameTurn = 0,
      gameWinner = 'a',
      tttArray = $('.content2'),
      lastPlayer =  'X',
      colorScheme = {
        red: '#AC433B',
        green: '#2D843C',
        blue: '#6C999F'
      },
      curDate = Date().toString(),
      firebaseRef = undefined,
      playerState = undefined,
      sessionID = Math.random().toString(36).substring(7);

    $('.winPopup').hide();
    $('.sesID').text(sessionID);
    $('#loginSesIDInput').val(sessionID);
    // firebaseRef.child(sessionID).set('Game Active!');

    function yell(){
      console.log(Date());
    }
    
    function openSession(){
      sessionID = $('#loginSesIDInput').val();
      userName = $('#loginNameInput').val();
      firebaseRef = firebase.database().ref('/sessions/' + '/' + sessionID + '/');
      // if (firebaseRef.once('host').then(() => return false) ){
      //
      // } else {
      //   //show the failure if the host already exists
      // }
      firebaseRef.child('host').set(userName);
      firebaseRef.child('createdOn').set(curDate);
      playerState = 'host';
      firebaseRef.child('host').on('value', yell);
      $('.loginScreen').hide();
      $('#sessionID').text('Session ID: ' + sessionID + ' ');

    }

    function joinSession(){
      var a = 'some stuff';
      // TODO: Add join session logic here
    }

    function testWin(){
        winSec(0, 1, 2);//row 1
        winSec(3, 4, 5);//row 2
        winSec(6, 7, 8);//row 3
        winSec(0, 4, 8);//diagonal left right
        winSec(2, 4, 6);//diagonal right left
        winSec(0, 3, 6);//column 1
        winSec(1, 4, 7);//column 2
        winSec(2, 5, 8);//column 3
        firebaseRef.child(sessionID).set(lastPlayer);
    }

    function winSec(a, b, c){
            if ($(tttArray[a]).text() === $(tttArray[b]).text() &&
                $(tttArray[a]).text() === $(tttArray[c]).text() &&
                $(tttArray[a]).text() != ''){
                    $(tttArray[a]).css('background-color', colorScheme.green);
                    $(tttArray[b]).css('background-color', colorScheme.green);
                    $(tttArray[c]).css('background-color', colorScheme.green);
                    $('.winPopup').show();
                    $('.winPopup').html('<br/><br/><br/>' + lastPlayer + ' Wins!<br/>Click to reset');
                    gameTurn = 3;
                    }
        }

    $('.content2').click(function(){
        event.stopPropagation();
        var curText = $(this).text();

        if(gameTurn === 0 && curText === ''){
            gameTurn = 1;
            $(this).text('X');
            $('#playerTurn').text('Player Turn: O');
            lastPlayer = 'X';
            testWin();
        } else if(gameTurn === 1 && curText === ''){
            gameTurn = 0;
            $(this).text('O');
            $('#playerTurn').text('Player Turn: X');
            lastPlayer = 'O';
            testWin();
        }

        var arrayTie = $('.content2').text();
        if(tttArray.length === arrayTie.length) {
            $('.winPopup').show();
            $('.winPopup').html('<br/><br/><br/>Tie! <br/>Click to reset!');
        }
    });

    $('.winPopup').click(function(){
        event.stopPropagation();
        $(this).hide();
        $('.content2').css('background-color', colorScheme.red);
        gameTurn = 0;
        $('.content2').text('');
        $('#playerTurn').text('Player Turn: X');
    });

    $('.loginBtn').on('click', openSession);

    $('#sessionID').click()
});
