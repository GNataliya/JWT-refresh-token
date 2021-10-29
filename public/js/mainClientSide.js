const productsCell = document.querySelector('.products'); 
const linkSignIn = document.querySelector('.linkSignIn');

const checkUserAccess = async () => {
    const accessToken = await localStorage.getItem('userAccessKey');
    // const token = JSON.parse(accessToken);
    console.log('get from localStore', accessToken)
    const { data } = await axios.post('/authorisation/checkUserToken', accessToken );
    console.log('19 - checkUser', data);
    if(data.status === 'unauthorisate'){
        window.location.href = '/authorisation'
        // registrEl.classList.remove('hidden');  
        // authEl.classList.add('.hidden');
    } else if (data.status === 'ok'){
        // linkSignIn.classList.add('hidden');
        // window.location.href = '/'
        linkSignIn.innerHTML = `<h3>${data.payload.result.name}</h3>`;
        // console.log('after status', data)
    }
}
checkUserAccess();

const checkAccessToken = async () => {
    const accessToken = await localStorage.getItem('userAccessKey');
    const refreshToken = await localStorage.getItem('refreshToken');
    const { data } = await axios.post('/authorisation/refreshToken', {accessToken, refreshToken} );
    console.log('20 - checkAcsessToken', data)

    if(data.status === 'fail authorisation'){
        authEl.innerHTML = `<h3>Uncorrect login or password</h3>`
    } else if(data.status === 'ok'){
        localStorage.setItem('userAccessKey', data.payload.payload.accessT);
        localStorage.setItem('refreshToken', data.payload.payload.refreshT);
        // window.location.href = '/'
    };

}
checkAccessToken();



// get All products from db with created card
const getGoods = async () => {
    const { data } = await axios.post('/products');
    //console.log('front', data);
    return data;
};

// showing all products on the page
const renderGoods = async () => {
    const goods = await getGoods();
    productsCell.insertAdjacentHTML('beforeend', goods);
};
renderGoods();



