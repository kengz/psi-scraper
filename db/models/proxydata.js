module.exports = function fn(sequelize, DataTypes) {
  const ProxyData = sequelize.define('ProxyData', {
    url: DataTypes.STRING,
    ip: DataTypes.STRING,
    country: DataTypes.STRING,
    speed: DataTypes.INTEGER,
    anonimity: DataTypes.STRING,
    usable: DataTypes.BOOLEAN,
  }, {
    classMethods: {},
  })
  return ProxyData
}
