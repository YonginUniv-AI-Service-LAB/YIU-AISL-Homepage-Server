module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Project', {
        projectid: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: DataTypes.STRING(255),
        contents: DataTypes.TEXT,
        link: DataTypes.STRING(2048),
        writer: DataTypes.INTEGER,
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        img: DataTypes.STRING(255),
    }, {
        charset: 'utf8mb3',
        timestamps: false,
        tableName: 'project'
    });
};
