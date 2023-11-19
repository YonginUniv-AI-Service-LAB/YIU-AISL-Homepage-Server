module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Likes', {
        likeid: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        postid: DataTypes.INTEGER,
        liker: DataTypes.INTEGER,
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        charset: 'utf8mb3',
        timestamps: false,
        tableName: 'likes'
    });
};
