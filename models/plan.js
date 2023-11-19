module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Plan', {
        planid: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        writer: DataTypes.INTEGER,
        date: DataTypes.DATE,
        contents: DataTypes.TEXT,
    }, {
        charset: 'utf8mb3',
        timestamps: false,
        tableName: 'plan'
    });
};
