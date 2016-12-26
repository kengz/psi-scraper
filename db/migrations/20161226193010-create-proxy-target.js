module.exports = {
  up(queryInterface, Sequelize) {
    return queryInterface.createTable('ProxyTargets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      url: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      success: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      freq: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    })
  },
  down(queryInterface) {
    return queryInterface.dropTable('ProxyTargets')
  },
}
