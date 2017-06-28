$(document).ready(function(){
    //Global Vars
    var gameTurn = 0;
    var gameWinner = 'a';
    var tttArray = $('.content2');
    var lastPlayer =  'X';
    $('.winPopup').hide();
    
    function testWin(){
        winSec(0, 1, 2);//row 1
        winSec(3, 4, 5);//row 2
        winSec(6, 7, 8);//row 3
        winSec(0, 4, 8);//diagonal left right
        winSec(2, 4, 6);//diagonal right left
        winSec(0, 3, 6);//column 1
        winSec(1, 4, 7);//column 2
        winSec(2, 5, 8);//column 3
    }
    
    
    function winSec(a, b, c){
            if ($(tttArray[a]).text() === $(tttArray[b]).text() &&
                $(tttArray[a]).text() === $(tttArray[c]).text() &&
                $(tttArray[a]).text() != ''){
                    $(tttArray[a]).css('background-color', 'green');
                    $(tttArray[b]).css('background-color', 'green');
                    $(tttArray[c]).css('background-color', 'green');
                    winGame($(tttArray[a]).text());
                    $('.winPopup').show();
                    $('.winPopup').html('<br/><br/><br/>' + lastPlayer + ' Wins!<br/>Click to reset');
                    }
                    
        }
    
            

    function winGame(winnerLetter){
        $('.content2').text('');
        gameTurn = 3;
    }
    
    
    $('.content2').click(function(){
        event.stopPropagation();
        var curText = $(this).text();
        
        if(gameTurn === 0 && $(this).text() === ''){
            gameTurn = 1;
            $(this).text('X');
            lastPlayer = 'X';
            testWin();
        } else if(gameTurn === 1 && $(this).text() === ''){
            gameTurn = 0;
            $(this).text('O');
            lastPlayer = 'O';
            testWin();
        }
        
        var arrayTie = $('.content2').text();
        console.log(arrayTie.length, tttArray.length);
        if(tttArray.length == arrayTie.length) {
            $('.winPopup').show();
            $('.winPopup').html('<br/><br/><br/>Tie! <br/>Click to reset!');
        }      
    });
        
    
    $('.winPopup').click(function(){
        event.stopPropagation();
        $(this).hide();
        $('.content2').css('background-color', 'red');  
        gameTurn = 0;
        $('.content2').text('');
    });
});

