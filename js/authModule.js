var firebaseAuth = {
  provider: new firebase.auth.FacebookAuthProvider(),
  authModule: function(){
    console.log('hello');
  },
  signIn: function(){
    firebase.auth().signInWithPopup(firebaseAuth.provider).then(function(result) {
      // This gives you a Facebook Access Token. You can use it to access the Facebook API.
      var token = result.credential.accessToken;
      // The signed-in user info.
      var user = result.user;
      // ...
      }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
      });
  },
  red: 'blue'

}
export default firebaseAuth;
