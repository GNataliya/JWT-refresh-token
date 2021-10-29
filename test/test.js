const authCtrl = require('../controllers/authorisation');

const init = async () => {
    const result = await authCtrl.login('GNataliya@gggg', 1);
    console.log(result)
}
init();