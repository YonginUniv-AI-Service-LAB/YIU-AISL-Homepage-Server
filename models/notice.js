module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Notice",
    {
      noticeid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: DataTypes.STRING(255),
      contents: DataTypes.TEXT,
      writer: DataTypes.INTEGER,
      views: { type: DataTypes.INTEGER, defaultValue: 0 },
      img: DataTypes.STRING(255),
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      charset: "utf8mb3",
      timestamps: false,
      tableName: "notice",
    }
  );
};
