module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Post', {
        postid: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        contents: DataTypes.TEXT,
        writer: DataTypes.INTEGER,
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        charset: 'utf8mb3',
        timestamps: false,
        tableName: 'post'
    });
};
