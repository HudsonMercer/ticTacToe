//V2.2 RC Internet Multiplayer, Firebase integration, Jquery DOM manipulation

// $(document).ready(function(){
//"Global" Vars

import session from './sessionModule.jsx';

firebase.initializeApp(session.fbconfig);
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
