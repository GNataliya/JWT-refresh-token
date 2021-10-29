const userModel = require('../models/user');
const tokenModel = require('../models/token');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const uniqid = require('uniqid');
const getPrivateKey = require('./getPrivKey');
const getPublicKey = require('./getPubKey');


// create user profile in db and access token for this user
const createUser = async (name, login, pwd) => {    // name
    // console.log('2 - back create', name, login, pwd)
    const doc = await userModel.create({
        name,                                  // get names from schema cells
        auth: {
            login,
            pwd
        }
    })
    // console.log('3 - doc', doc)
    
    const profile = {
        id: doc._id,
        name: doc.name
    };

    const accessToken = await createAccessToken(profile);
    // console.log('9 - accessToken', accessToken)
    return {status: 'ok', payload: { profile, accessToken }};
    // return profile;
}

// check there is user email in db
const checkEmail = async (login) => {
    const doc = await userModel.findOne({ 'auth.login': login });
    
    // if there isn't such login return unknown user
    if(doc){
        return { status: 'email already declarated'};
    };

    return {status: 'ok'};
}

// check user in db by pwd and login 
const login = async (login, pwd) => {
    const doc = await userModel.findOne({ 'auth.login': login });
    //console.log('doc', doc)
    
    // if there isn't such login return unknown user
    if(!doc){
        return { status: 'unknown user'};
    };

    // if there is login => check password
    const check = doc.checkPwd(pwd); 
    if(!check){
        return { status: 'invalid password'};
    };

    // get user id and user name 
    const profile = {
        id: doc.id,
        name: doc.name
    };

    const accessToken = await createAccessToken(profile);
    const refreshToken = await createRefreshToken(accessToken);
    return {status: 'ok', payload: profile, accessToken, refreshToken };
};

const updateTokens = async (accessToken, refreshToken) => {
    
    const accessTokenDecoded = await checkAndDecode(accessToken);
    // console.log('24 - CTRL asccessTokenDecoded', accessTokenDecoded);

    if(accessTokenDecoded.status !== 'ok'){
        return 'uncorrect accsess token'
    };

    const { result } = accessTokenDecoded;
    delete(result.exp);
    const userId = result.id;
    // console.log('25 - CTRL payload accessTokenDecoded', result);
    
    const doc = await tokenModel.findOne({ accessToken: accessToken, refreshToken: refreshToken });
    console.log('25 - CTRL payload accessTokenDecoded', doc);
    if(!doc) {
        return { status: 'there isn`t such refresh token'}
    }

    doc.delete();   // delete old refresh token

    const accessT = await createAccessToken(result);
    const refreshT = await createRefreshToken(accessT, userId);

    // const profile = {
    //     id: doc._id,
    //     name: doc.name
    // };

    return {status: 'ok', payload: { userId, accessT, refreshT } };
}

// creste public key and check user's private key 
const checkAndDecode = async (accessToken) => {
    // console.log('13 - accessToken', accessToken, typeof(accessToken))
    const pubKey = await getPublicKey();
    // console.log('14 - pubKey', pubKey)
    const result = await jwt.verify(accessToken, pubKey, { algorithms: ['RS256'] });
    // console.log('15 - CTRL result', result)
    if(!result){
        return { status: 'Invalid token'}
    }

    //const data = jwt.decode(accessToken);
    //const payload = JSON.parse(data.payload);

    return {status: 'ok', result};
};


// create access token (private) token for user
const createAccessToken = async (payload) => {
    // console.log('4 - payload', payload)
    const privKey = await getPrivateKey();
    // console.log('7 - privKey', privKey);

    {
        const now = moment();   // current time

        // if there is exp and previos exp finished (less current)
        if(payload.exp && moment(payload.exp) < now ){
            delete (payload.exp)
        }

        // if there isn't field exp
        if(!payload.exp){
            const exp = Number(now.add(30, 'ss'));
            payload.exp = exp;
        }
    }

    const token = await jwt.sign(
        payload,
        privKey,
        { algorithm: 'RS256' },
    );
    // console.log('8 - token', token)
    return token;
}


// create refresh token for user's access token 
const createRefreshToken = async (accessToken) => {
    const accessTokenDecoded = await checkAndDecode(accessToken);
    const { result } = accessTokenDecoded;
    // delete(result.exp);
    const user = result.id;
    console.log('22 - CTRL accessToken, userId', result, user)
    const refreshToken = uniqid('refreshT-');
    console.log('23 - CTRL refreshToken', refreshToken)

    //addTokens(accessToken, refreshToken, userId);
    const doc = await tokenModel.create({accessToken, refreshToken, user});
    
    return refreshToken;
}





module.exports = {
    createUser,
    checkEmail,
    login,
    checkAndDecode,
    updateTokens
}