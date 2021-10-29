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
    // console.log('11 - rout', result)

    const { payload, accessToken, refreshToken } = result;
    // console.log('12 - rout', payload, accessToken, refreshToken)
    if([ 'unknown user', 'invalid password' ].includes(result.status)){
        res.json({ status: 'fail authorisation'});
        return;
    }
    
    res.json({ status: 'ok', user: payload, accessToken, refreshToken });
});


// for checking user id on every page and get user id
router.post('/checkUserToken', upload.none(), async (req, res) => {
    // console.log('16 - rout req.body', req.body)
    
    const accessToken = req.body;
    
    // const accessToken = req.body;    // get user token from front
    // console.log('17 - rout checkAndDecode', String(Object.keys(accessToken)), typeof(accessToken))
    
    // if there isn't user token
    if(!accessToken){                           
        res.json({ status: 'unauthorisate'});
        return;
    }

    const checkResult = await authCtrl.checkAndDecode(String(Object.keys(accessToken))); // get profile from db by id session    
    // console.log('18 - rout check result', checkResult)
    res.json({ status: 'ok', payload: checkResult })
    
});

// for checking user id on every page and get user id
router.post('/refreshToken', upload.none(), async (req, res) => {
    // console.log('21 - rout req.body', req.body);
    
    const { accessToken, refreshToken } = req.body;
    console.log('21 - rout accessToken, refreshToken', accessToken, refreshToken);
    
    // if there isn't user token
    // if(!accessToken){                           
    //     res.json({ status: 'unauthorisate'});
    //     return;
    // }

    const checkAndRefresh = await authCtrl.updateTokens(accessToken, refreshToken);

    // const checkResult = await authCtrl.checkAndDecode(String(Object.keys(accessToken))); // get profile from db by id session    
    console.log('26 - rout checkAndRefresh', checkAndRefresh)
    res.json({ status: 'ok', payload: checkAndRefresh })
    
});

// router.post('/logout', (req, res) => {
//     //res.render('logout');
// });


// create user doc in db
router.post('/signup', upload.none(), async (req, res) => {
   
    const { name, login, pwd } = req.body;
    // console.log('1 - get from front', name, login, pwd)

    const isEmail = await authCtrl.checkEmail(login);
    //console.log('checkEmail', isEmail);
   
    if (isEmail.status === 'email already declarated'){
        res.json({ status: 'dublicate_email' })
        return;
    };

    const createNewUser = await authCtrl.createUser( name, login, pwd );
    // console.log('10 - createNewUser', createNewUser)
    
    // const { id, name } = createNewUser.payload.profile;
    // const id = createNewUser.payload.doc._id;
    // const userName = createNewUser.payload.doc.name;
    const { profile, accessToken } = createNewUser.payload;
    
    res.json({ status: 'ok', user: profile, accessToken  });
});


module.exports = router;
