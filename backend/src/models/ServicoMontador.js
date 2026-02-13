module.exports = (sequelize, DataTypes) => {
  return sequelize.define('ServicoMontador', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    servico_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    usuario_id: {
      type: DataTypes.UUID
    },
    equipe_id: {
      type: DataTypes.UUID
    },
    valor_atribuido: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    percentual_divisao: {
      type: DataTypes.DECIMAL(5, 2)
    },
    papel: {
      type: DataTypes.STRING(20) // 'principal', 'auxiliar'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'servico_montadores',
    timestamps: false
  });
};
