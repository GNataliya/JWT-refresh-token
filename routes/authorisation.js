const express = require('express');
const axios = require('axios');
const multer = require('multer');
const upload = multer();
const router = express.Router();

const authCtrl = require('../controllers/authorisation.js');

/* GET home page. */
router.get('/', (req, res) => {
    res.render('login');
});


router.post('/login', upload.none(), async (req, res) => {
    
    const { login, pwd } = req.body;

    const result = await authCtrl.login(login, pwd);

    const { payload, accessToken, refreshToken } = result;
    
    if([ 'unknown user', 'invalid password' ].includes(result.status)){
        res.json({ status: 'fail authorisation'});
        return;
    }
    
    res.json({ status: 'ok', user: payload, accessToken, refreshToken });
});


// for checking user id on every page and get user id
router.post('/checkUserToken', upload.none(), async (req, res) => {
    
    const accessToken = req.body;
    
    // if there isn't user token
    if(!accessToken){                           
        res.json({ status: 'unauthorisate'});
        return;
    }

    const checkResult = await authCtrl.checkAndDecode(String(Object.keys(accessToken))); // get profile from db by id session    
    
    res.json({ status: 'ok', payload: checkResult })
    
});


// for checking user id on every page and get user id
router.post('/refreshToken', upload.none(), async (req, res) => {
    
    const { accessToken, refreshToken } = req.body;

    const checkAndRefresh = await authCtrl.updateTokens(accessToken, refreshToken);

    res.json({ status: 'ok', payload: checkAndRefresh })
    
});




// create user doc in db
router.post('/signup', upload.none(), async (req, res) => {
   
    const { name, login, pwd } = req.body;

    const isEmail = await authCtrl.checkEmail(login);
   
    if (isEmail.status === 'email already declarated'){
        res.json({ status: 'dublicate_email' })
        return;
    };

    const createNewUser = await authCtrl.createUser( name, login, pwd );
  
    const { profile, accessToken } = createNewUser.payload;
    
    res.json({ status: 'ok', user: profile, accessToken  });
});


module.exports = router;
