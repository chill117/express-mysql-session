module.exports = function(sequelize, DataTypes, app) {

	return sequelize.define('Session', {

		session_id: {
			type: DataTypes.STRING,
			primaryKey: true,
			unique: true,
			allowNull: false
		},
		expires: DataTypes.INTEGER,
		json: DataTypes.TEXT

	}, {

		tableName: 'sessions',
		freezeTableName: true,

		engine: 'InnoDB',
		charset: 'utf8',
		collate: 'utf8_bin',

		underscored: true

	})

}