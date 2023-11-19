module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "User",
    {
      userid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: DataTypes.STRING(255),
      email: DataTypes.STRING(255),
      pwd: DataTypes.STRING(255),
      question: DataTypes.STRING(255),
      answer: DataTypes.STRING(255),
      master: { type: DataTypes.TINYINT, defaultValue: 0 },
      token: DataTypes.TEXT,
    },
    {
      charset: "utf8mb3",
      timestamps: false,
      tableName: "user",
    }
  );
};
