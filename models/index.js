const Sequelize = require('sequelize');

const config = require('../config/config.json')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require('./user')(sequelize, Sequelize.DataTypes);
db.Post = require('./post')(sequelize, Sequelize.DataTypes);
db.Likes = require('./likes')(sequelize, Sequelize.DataTypes);
db.Notice = require('./notice')(sequelize, Sequelize.DataTypes);
db.Plan = require('./plan')(sequelize, Sequelize.DataTypes);
db.Project = require('./project')(sequelize, Sequelize.DataTypes);

db.User.hasMany(db.Notice, {foreignKey: 'writer', sourceKey: 'userid', onDelete: 'CASCADE'});
db.User.hasMany(db.Plan, {foreignKey: 'writer', sourceKey: 'userid', onDelete: 'CASCADE'});
db.User.hasMany(db.Post, {foreignKey: 'writer', sourceKey: 'userid', onDelete: 'CASCADE'});// , as: 'writerUser'
db.User.hasMany(db.Project, {foreignKey: 'writer', sourceKey: 'userid'});
db.User.hasMany(db.Likes, {foreignKey: 'liker', sourceKey: 'userid', onDelete: 'CASCADE'});//as: 'likeUser',
db.Post.hasMany(db.Likes, {foreignKey: 'postid', sourceKey: 'postid', onDelete: 'CASCADE'});//as: 'likeUser',

db.Likes.belongsTo(db.User, {foreignKey: 'liker', targetKey: 'userid',}); //as: 'likeUser'
db.Post.belongsTo(db.User, {foreignKey: 'writer', targetKey: 'userid',});//as: 'writerUser'
db.Likes.belongsTo(db.Post, {foreignKey: 'postid', targetKey: 'postid'});

db.User.hasMany(db.Notice, {foreignKey: 'writer', sourceKey: 'userid', onDelete: 'CASCADE'});

db.Notice.belongsTo(db.User, {foreignKey: 'writer', targetKey: 'userid'});

// User 모델과 Project 모델 간의 관계 설정
db.User.hasMany(db.Project, {foreignKey: 'writer', sourceKey: 'userid',}); //as: 'userProjects'
db.Project.belongsTo(db.User, {foreignKey: 'writer', targetKey: 'userid',}); //as: 'projectWriter'

module.exports = db;
