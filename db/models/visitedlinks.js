// create with:
// sequelize model:create --name VisitedLinks --attributes "url:string success:boolean"

module.exports = function fn(sequelize, DataTypes) {
  const VisitedLinks = sequelize.define('VisitedLinks', {
    url: DataTypes.STRING,
    success: DataTypes.BOOLEAN,
  }, {
    classMethods: {
      // associate(models) {
        // associations can be defined here
      // },
    },
  })
  return VisitedLinks
}
