module.exports = function fn(sequelize, DataTypes) {
  const ProxyTarget = sequelize.define('ProxyTarget', {
    url: DataTypes.STRING,
    success: DataTypes.BOOLEAN,
    freq: DataTypes.INTEGER, // how many times its hit
  }, {
    classMethods: {},
  })
  return ProxyTarget
}
