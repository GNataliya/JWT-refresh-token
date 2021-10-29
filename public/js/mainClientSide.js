const productsCell = document.querySelector('.products'); 
const linkSignIn = document.querySelector('.linkSignIn');

const checkUserAccess = async () => {
    
    const accessToken = await localStorage.getItem('userAccessKey');
    
    const { data } = await axios.post('/authorisation/checkUserToken', accessToken );
    
    if(data.status === 'unauthorisate'){
        window.location.href = '/authorisation'
    } else if (data.status === 'ok'){
        linkSignIn.innerHTML = `<h3>${data.payload.result.name}</h3>`;
    }
}
checkUserAccess();


const checkAccessToken = async () => {
    
    const accessToken = await localStorage.getItem('userAccessKey');
    const refreshToken = await localStorage.getItem('refreshToken');
    
    const { data } = await axios.post('/authorisation/refreshToken', {accessToken, refreshToken} );

    if(data.status === 'fail authorisation'){
        authEl.innerHTML = `<h3>Uncorrect login or password</h3>`
    } else if(data.status === 'ok'){
        localStorage.setItem('userAccessKey', data.payload.payload.accessT);
        localStorage.setItem('refreshToken', data.payload.payload.refreshT);
    };
}
checkAccessToken();



// get All products from db with created card
const getGoods = async () => {
    const { data } = await axios.post('/products');
     return data;
};

// showing all products on the page
const renderGoods = async () => {
    const goods = await getGoods();
    productsCell.insertAdjacentHTML('beforeend', goods);
};
renderGoods();



