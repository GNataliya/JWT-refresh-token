const path = require('path');
const mongoose = require('mongoose');
const { Schema } = mongoose;

require('./user');

const generalSchema = new Schema ({
    accessToken: {
        type: Schema.Types.String,
        required: true,
        minlength:2,
        unique: true           
    },
    refreshToken: {
        type: Schema.Types.String,
        required: true,
        minlength:2,
        unique: true           // проверяет на наличие такой же инфо в БД, что б не дублировать
    },
    user: [{
        type: Schema.Types.ObjectId, ref: 'user',
    }],
});

//const model = mongoose.model('article', generalSchema);
const modelname = path.basename(__filename, '.js');   // название модели совпадает с названием файла модели.
// получаем имя файла без расширения .js
const model = mongoose.model(modelname, generalSchema); // создаем модель
module.exports = model;
