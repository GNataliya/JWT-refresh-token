const userModel = require('../models/user');
const tokenModel = require('../models/token');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const uniqid = require('uniqid');
const getPrivateKey = require('./getPrivKey');
const getPublicKey = require('./getPubKey');


// create user profile in db and access token for this user
const createUser = async (name, login, pwd) => {    // name
   
    const doc = await userModel.create({
        name,                                  // get names from schema cells
        auth: {
            login,
            pwd
        }
    });
    
    const profile = {
        id: doc._id,
        name: doc.name
    };

    const accessToken = await createAccessToken(profile);
    
    return {status: 'ok', payload: { profile, accessToken }};   
};


// check there is user email in db
const checkEmail = async (login) => {
    const doc = await userModel.findOne({ 'auth.login': login });
    
    // if there isn't such login return unknown user
    if(doc){
        return { status: 'email already declarated'};
    };

    return {status: 'ok'};
};


// check user in db by pwd and login 
const login = async (login, pwd) => {
    const doc = await userModel.findOne({ 'auth.login': login });
    
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

    if(accessTokenDecoded.status !== 'ok'){
        return 'uncorrect accsess token'
    };

    const { result } = accessTokenDecoded;
    delete(result.exp);
    const userId = result.id;
    
    const doc = await tokenModel.findOne({ accessToken: accessToken, refreshToken: refreshToken });
  
    if(!doc) {
        return { status: 'there isn`t such refresh token'}
    }

    doc.delete();   // delete old refresh token

    const accessT = await createAccessToken(result);
    const refreshT = await createRefreshToken(accessT, userId);

    return {status: 'ok', payload: { userId, accessT, refreshT } };
};


// creste public key and check user's private key 
const checkAndDecode = async (accessToken) => {
    
    const pubKey = await getPublicKey();
    
    const result = await jwt.verify(accessToken, pubKey, { algorithms: ['RS256'] });
    
    if(!result){
        return { status: 'Invalid token'}
    }

    return {status: 'ok', result};
};


// create access token (private) token for user
const createAccessToken = async (payload) => {
   
    const privKey = await getPrivateKey();

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
   
    return token;
};


// create refresh token for user's access token 
const createRefreshToken = async (accessToken) => {
    
    const accessTokenDecoded = await checkAndDecode(accessToken);
    const { result } = accessTokenDecoded;
    const user = result.id;
    
    const refreshToken = uniqid('refreshT-');

    const doc = await tokenModel.create({accessToken, refreshToken, user});
    
    return refreshToken;
};





module.exports = {
    createUser,
    checkEmail,
    login,
    checkAndDecode,
    updateTokens
}
