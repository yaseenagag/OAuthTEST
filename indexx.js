var express = require('express');
var cookieSession = require('cookie-session');
var request = require('request');
var qs = require('querystring');
var app = express();
var GitHub = require('github-api');


if (app.get('env') !== 'production'){
  require('dotenv').config();
}

var port = process.env.PORT || 3000;

app.set('trust proxy', 1) // trust first proxy

app.use(cookieSession({
  name: 'session',
  keys: [
    '86637a8a5169c6b2fd76b01676b039207eb5e1e0',
    '36093fb4e8d0d4019667d519754f358eeec30b79'
  ]
}))

app.get('/', function (req, res) {
  if (!req.session.github_access_token){
    var scope = 'user%20public_repo%20read:org%20repo%20repo:status'
    var github_oauth_login_url = 'https://github.com/login/oauth/authorize?'
    github_oauth_login_url += 'scope='+scope
    github_oauth_login_url += '&client_id='+process.env.GITHUB_CLIENT_ID
    github_oauth_login_url += '&redirect_uri='+process.env.GITHUB_REDIRECT_URI
    github_oauth_login_url += '&state=FROGS_SUCK'
    res.send('<h1>Please log in!</h1><a href="'+github_oauth_login_url+'">Click here now</a> to begin!</a>');
    return;
  }

  var gh = new GitHub({token: req.session.github_access_token});

  var me = gh.getUser()

  me.getProfile().then(function(response){
    var profile = response.data;
    console.log('profile => ', profile)
    res.send('<h1>Welcome back '+profile.login+'</h1><a href="/logout">Logout</a>');
  }).catch(function(error){
    console.log('getProfile promise failed')
    console.error(error)
    res.send('<h1>ERROR getting your profile info</h1>'+error);
  })
});

app.get('/oauth_callback', function(req,res){
  var code = req.query.code, state = req.query.state;
  console.log('req.query', req.query)

  var url = 'https://github.com/login/oauth/access_token?'+qs.stringify({
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    redirect_uri: process.env.GITHUB_REDIRECT_URI,
    code: req.query.code,
    state: state
  })

  request({
    method: 'post',
    url: url,
    headers: {
      'User-Agent': 'Node'
    },
  }, function(error, response, body){
    if (error) throw error;
    var params = qs.parse(response.body)
    req.session.github_access_token = params.access_token;
    res.redirect("/")
  })
})

app.get('/logout', function(req,res){
  delete req.session.github_access_token
  res.redirect('/')
})

app.listen(port, function () {
  console.log('Example app listening on port http://0.0.0.0:'+port);
});
